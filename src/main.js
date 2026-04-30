import { startEngine } from './engine/loop.js';
import { askPlayerName } from './ui/name-prompt.js';
import { showIntro } from './ui/intro.js';
import { getPlayerName } from './state/profile.js';
import { clearPendingKeys } from './engine/input.js';
import { onBurdenChange, getBurden, resetBurden, setBurden } from './state/burden.js';
import { onScoresChange, getCompletedCount, getTotalScore, resetScores, markCompleted } from './state/scores.js';
import { clearProfile } from './state/profile.js';
import { getApiKey } from './ai/env-loader.js';
import { onSentimentState } from './ai/sentiment.js';
import * as Audio from './audio/audio.js';

const TOTAL_OBJECTS = 8;

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
function paintBurden(score) {
    burdenScoreEl.textContent = String(score);
    burdenFillEl.style.width = `${score}%`;
    
    if (score <= 30) {
        burdenFillEl.style.background = '#FFB000';
    } else if (score <= 70) {
        burdenFillEl.style.background = '#FF5722';
    } else {
        burdenFillEl.style.background = '#8B0000';
    }
    
    document.body.classList.toggle('high-burden', score >= 70);
    // Ses hook'ları: drone burden'a göre kararsızlaşır, ani sıçrama varsa kalp atışı
    Audio.setDroneBurden(score);
    if (score - lastBurdenSeen >= 7) Audio.playBurdenSpike();
    lastBurdenSeen = score;
}

async function checkApiKey() {
    const key = await getApiKey();
    if (!key || key === 'YOUR_API_KEY_HERE') {
        const banner = document.getElementById('api-warning');
        if (banner) banner.classList.remove('hidden');
    }
}

function paintProgress() {
    const done = getCompletedCount();
    const total = getTotalScore();
    hudProgress.textContent = `YANSIMALAR: ${done}/${TOTAL_OBJECTS}     PUAN: ${total}`;
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
    // Her sayfa yenilemesinde temiz başla — kalıcılık devre dışı
    clearProfile();
    resetBurden();
    resetScores();

    // Oyun motoru intro tamamlanana kadar gizli — sadece modal görünür
    gameContainer.classList.add('pre-intro');

    onBurdenChange(paintBurden);
    paintBurden(getBurden());
    onScoresChange(paintProgress);
    paintProgress();

    // 1. Önce yalnızca isim kutucuğu
    await askPlayerName();
    hudPlayer.textContent = `ASKER: ${getPlayerName().toUpperCase()}`;
    clearPendingKeys();
    checkApiKey();

    // 2. Sonra yalnızca hikâye + kontroller
    await showIntro(getPlayerName());
    clearPendingKeys();

    // 3. Şimdi oyun ekranı belirir
    gameContainer.classList.remove('pre-intro');

    // Ses motorunu başlat — intro space gesture'ı user gesture sayılır
    Audio.start();
    Audio.startRain(0.4);
    Audio.startDrone();

    startEngine(canvas, {
        startRoom: 'bedroom',
        onRoomChange: (room) => {
            hudRoom.textContent = `KONUM: ${room.name.toUpperCase()}`;
            // Mutfakta pencere yakın — yağmur sesi güçlenir
            Audio.setRainIntensity(room.id === 'kitchen' ? 0.75 : 0.4);
        },
    });

    canvas.focus();
}

boot();

// --- DEV CHEAT (API'siz finale testi için) ---
// Console'da: cheat.lightEnd()  veya  cheat.heavyEnd()
// Sonra oturma odasının üst duvarındaki Cennetin Kapısı'na yürü, E'ye bas.
const OBJECT_IDS = ['letter', 'toy', 'guitar', 'gun', 'badge', 'window', 'mom', 'record_player'];
window.cheat = {
    completeAll() { OBJECT_IDS.forEach((id) => markCompleted(id)); },
    setBurden(v)  { setBurden(v); },
    lightEnd()    { OBJECT_IDS.forEach((id) => markCompleted(id)); setBurden(20); console.log('OK — kapıya yürü, E ile aç. burden=20 (LIGHT)'); },
    heavyEnd()    { OBJECT_IDS.forEach((id) => markCompleted(id)); setBurden(80); console.log('OK — kapıya yürü, E ile aç. burden=80 (HEAVY)'); },
};
