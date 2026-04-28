import { startEngine } from './engine/loop.js';
import { askPlayerName } from './ui/name-prompt.js';
import { showIntro } from './ui/intro.js';
import { getPlayerName } from './state/profile.js';
import { clearPendingKeys } from './engine/input.js';
import { onBurdenChange, getBurden, resetBurden, setBurden } from './state/burden.js';
import { onScoresChange, getCompletedCount, getTotalScore, resetScores, markCompleted } from './state/scores.js';
import { clearProfile } from './state/profile.js';
import { getApiKey } from './ai/env-loader.js';

const TOTAL_OBJECTS = 7;

const canvas    = document.getElementById('game-canvas');
const gameContainer = document.getElementById('game-container');
const hudRoom   = document.getElementById('hud-room');
const hudPlayer = document.getElementById('hud-player');
const burdenScoreEl = document.getElementById('burden-score');
const burdenFillEl  = document.getElementById('burden-fill');
const hudProgress   = document.getElementById('hud-progress');

function paintBurden(score) {
    burdenScoreEl.textContent = String(score);
    burdenFillEl.style.width = `${score}%`;
    // Yeşil -> kehribar -> kan kırmızı
    const r = Math.round(90 + (220 - 90)  * (score / 100));
    const g = Math.round(220 - (220 - 30) * (score / 100));
    const b = Math.round(60  + (40  - 60) * (score / 100));
    burdenFillEl.style.background = `rgb(${r}, ${g}, ${b})`;
    document.body.classList.toggle('high-burden', score >= 70);
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

    startEngine(canvas, {
        startRoom: 'bedroom',
        onRoomChange: (room) => {
            hudRoom.textContent = `KONUM: ${room.name.toUpperCase()}`;
        },
    });

    canvas.focus();
}

boot();

// --- DEV CHEAT (API'siz finale testi için) ---
// Console'da: cheat.lightEnd()  veya  cheat.heavyEnd()
// Sonra oturma odasının üst duvarındaki Cennetin Kapısı'na yürü, E'ye bas.
const OBJECT_IDS = ['letter', 'toy', 'guitar', 'gun', 'badge', 'window', 'mom'];
window.cheat = {
    completeAll() { OBJECT_IDS.forEach((id) => markCompleted(id)); },
    setBurden(v)  { setBurden(v); },
    lightEnd()    { OBJECT_IDS.forEach((id) => markCompleted(id)); setBurden(20); console.log('OK — kapıya yürü, E ile aç. burden=20 (LIGHT)'); },
    heavyEnd()    { OBJECT_IDS.forEach((id) => markCompleted(id)); setBurden(80); console.log('OK — kapıya yürü, E ile aç. burden=80 (HEAVY)'); },
};
