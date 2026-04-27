import { startEngine } from './engine/loop.js';

const canvas = document.getElementById('game-canvas');
const hudRoom = document.getElementById('hud-room');

startEngine(canvas, {
    startRoom: 'kitchen',
    onRoomChange: (room) => {
        hudRoom.textContent = `KONUM: ${room.name.toUpperCase()}`;
    },
});

canvas.focus();
