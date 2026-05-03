import { startEngine } from './engine/loop.js';
import { askPlayerName } from './ui/name-prompt.js';
import { showIntro } from './ui/intro.js';
import { getPlayerName } from './state/profile.js';
import { clearPendingKeys } from './engine/input.js';
import { onBurdenChange, getBurden, resetBurden, setBurden } from './state/burden.js';
import { onScoresChange, getCompletedCount, getTotalScore, resetScores, markCompleted } from './state/scores.js';
import { clearProfile } from './state/profile.js';
import { getApiKey } from './ai/env-loader.js';
import { onSentimentState, ensureSentimentLoaded } from './ai/sentiment.js';
import * as Audio from './audio/audio.js';
import { generateEndingMusic, resetEndingMusic } from './audio/ending-music.js';

// Finale ilerlemesini belirleyen toplam etkileşimli yansıma sayısı.
const TOTAL_OBJECTS = 8;
const BURDEN_LOW_MAX = 30;
const BURDEN_HIGH_MIN = 70;
const BURDEN_COLORS = {
    low: '#FFB000',
    medium: '#FF5722',
    high: '#8B0000',
};
const API_KEY_PLACEHOLDER = 'YOUR_API_KEY_HERE';

let endingMusicTriggered = false;

const canvas    = document.getElementById('game-canvas');
const gameContainer = document.getElementById('game-container');
const hudRoom   = document.getElementById('hud-room');
const hudPlayer = document.getElementById('hud-player');
const burdenScoreEl = document.getElementById('burden-score');
const burdenFillEl  = document.getElementById('burden-fill');
const hudProgress   = document.getElementById('hud-progress');

const modelLoadingOverlay = document.getElementById('model-loading-overlay');
const modelProgressFill   = document.getElementById('model-progress-fill');
const modelProgressPct    = document.getElementById('model-progress-pct');

let lastBurdenSeen = 0;
function getBurdenColor(score) {
    if (score <= BURDEN_LOW_MAX) return BURDEN_COLORS.low;
    if (score <= BURDEN_HIGH_MIN) return BURDEN_COLORS.medium;
    return BURDEN_COLORS.high;
}

function formatProgressText(done, score) {
    return `YANSIMALAR: ${done}/${TOTAL_OBJECTS}     PUAN: ${score}`;
}

function paintBurden(score) {
    burdenScoreEl.textContent = String(score);
    burdenFillEl.style.width = `${score}%`;
    burdenFillEl.style.background = getBurdenColor(score);

    document.body.classList.toggle('high-burden', score >= BURDEN_HIGH_MIN);
    // Ses hook'ları: drone burden'a göre kararsızlaşır, ani sıçrama varsa kalp atışı.
    Audio.setDroneBurden(score);
    if (score - lastBurdenSeen >= 7) Audio.playBurdenSpike();
    lastBurdenSeen = score;
}

function isMissingApiKey(key) {
    return !key || key === API_KEY_PLACEHOLDER;
}

async function checkApiKey() {
    const key = await getApiKey();
    if (!isMissingApiKey(key)) return;

    const warningBanner = document.getElementById('api-warning');
    if (warningBanner) warningBanner.classList.remove('hidden');
}

function paintProgress() {
    const done = getCompletedCount();
    const total = getTotalScore();
    hudProgress.textContent = formatProgressText(done, total);

    // Pre-fetch: Son nesne etkileşimine 1 kala müzik üretimini başlat.
    // Oyuncu TOTAL_OBJECTS - 1 nesneyi tamamladığında tetiklenir.
    // generateEndingMusic kendi içinde cache/threshold kontrolü yapar;
    // aynı eşik ile tekrar çağrılırsa gereksiz üretim yapmaz.
    if (done >= TOTAL_OBJECTS - 1) {
        const currentBurden = getBurden();
        window._lastBurdenForMusic = currentBurden;
        if (!endingMusicTriggered) {
            endingMusicTriggered = true;
            console.log(`[main] Ending müzik pre-fetch tetiklendi - burden: ${currentBurden}, tamamlanan: ${done}/${TOTAL_OBJECTS}`);
        }
        generateEndingMusic(currentBurden).catch((err) => {
            console.warn('[main] Ending müzik üretim hatası:', err);
        });
    }
}

onSentimentState((state) => {
    if (state.status === 'loading' || state.status === 'progress') {
        modelLoadingOverlay.classList.add('visible');
        if (state.progress) {
            const pct = Math.round(state.progress);
            modelProgressFill.style.width = `${pct}%`;
            modelProgressPct.textContent = `${pct}%`;
        }
    } else {
        modelLoadingOverlay.classList.remove('visible');
    }
});

async function boot() {
    // Her sayfa yenilemesinde temiz başla - kalıcılık devre dışı.
    clearProfile();
    resetBurden();
    resetScores();
    resetEndingMusic();
    endingMusicTriggered = false;

    // Oyun motoru intro tamamlanana kadar gizli - sadece modal görünür.
    gameContainer.classList.add('pre-intro');

    onBurdenChange(paintBurden);
    paintBurden(getBurden());
    onScoresChange(paintProgress);
    paintProgress();

    // Model yüklemeyi arka planda başlat — kullanıcı isim girerken insin.
    ensureSentimentLoaded().catch(() => {});

    // 1. Önce yalnızca isim kutucuğu.
    await askPlayerName();
    hudPlayer.textContent = `ASKER: ${getPlayerName().toUpperCase()}`;
    clearPendingKeys();
    checkApiKey();

    // 2. Sonra yalnızca hikaye + kontroller.
    await showIntro(getPlayerName());
    clearPendingKeys();

    // 3. Şimdi oyun ekranı belirir.
    gameContainer.classList.remove('pre-intro');

    // Ses motorunu başlat - intro space gesture'ı user gesture sayılır.
    Audio.start();
    Audio.startRain(0.4);
    Audio.startDrone();

    startEngine(canvas, {
        startRoom: 'bedroom',
        onRoomChange: (room) => {
            hudRoom.textContent = `KONUM: ${room.name.toUpperCase()}`;
            // Mutfakta pencere yakın - yağmur sesi güçlenir.
            Audio.setRainIntensity(room.id === 'kitchen' ? 0.75 : 0.4);
        },
    });

    canvas.focus();
}

boot();

// --- DEV CHEAT (API'siz finale testi için) ---
// Console'da: cheat.lightEnd() veya cheat.heavyEnd()
// Sonra oturma odasının üst duvarındaki Cennetin Kapısı'na yürü, E'ye bas.
const OBJECT_IDS = ['letter', 'toy', 'guitar', 'gun', 'badge', 'window', 'mom', 'record_player'];
window.cheat = {
    completeAll() { OBJECT_IDS.forEach((id) => markCompleted(id)); },
    setBurden(v)  { setBurden(v); },
    lightEnd()    {
        OBJECT_IDS.forEach((id) => markCompleted(id));
        setBurden(20);
        // Önceki cache'i sıfırla ve yeniden üret.
        resetEndingMusic();
        endingMusicTriggered = true;
        window._lastBurdenForMusic = 20;
        generateEndingMusic(20).catch(() => {});
        console.log('OK - kapıya yürü, E ile aç. burden=20 (LIGHT) + ending müzik üretiliyor...');
    },
    heavyEnd()    {
        OBJECT_IDS.forEach((id) => markCompleted(id));
        setBurden(80);
        // Önceki cache'i sıfırla ve yeniden üret.
        resetEndingMusic();
        endingMusicTriggered = true;
        window._lastBurdenForMusic = 80;
        generateEndingMusic(80).catch(() => {});
        console.log('OK - kapıya yürü, E ile aç. burden=80 (HEAVY) + ending müzik üretiliyor...');
    },
};
