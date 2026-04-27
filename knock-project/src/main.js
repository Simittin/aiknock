import { startEngine } from './engine/loop.js';
import { askPlayerName } from './ui/name-prompt.js';
import { getPlayerName } from './state/profile.js';
import { clearPendingKeys } from './engine/input.js';

const canvas    = document.getElementById('game-canvas');
const hudRoom   = document.getElementById('hud-room');
const hudPlayer = document.getElementById('hud-player');

async function boot() {
    await askPlayerName();
    hudPlayer.textContent = `ASKER: ${getPlayerName().toUpperCase()}`;

    // İsim girişi sırasında basılan Enter'ı motorun ilk frame'ine taşıma
    clearPendingKeys();

    startEngine(canvas, {
        startRoom: 'bedroom',
        onRoomChange: (room) => {
            hudRoom.textContent = `KONUM: ${room.name.toUpperCase()}`;
        },
    });

    canvas.focus();
}

boot();
