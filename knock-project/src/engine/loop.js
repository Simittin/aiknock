import { PLAYER_SPEED, DOOR_R, DOOR_L } from '../config.js';
import { rooms, doorTransitions } from '../rooms/index.js';
import { player, placeAtTile, centerTile } from './player.js';
import { getMoveVector } from './input.js';
import { resolveMove } from './collision.js';
import { initRenderer, render } from './renderer.js';

let currentRoomId = 'kitchen';
let onRoomChange = null;

function tileTypeName(t) {
    if (t === DOOR_R) return 'DOOR_R';
    if (t === DOOR_L) return 'DOOR_L';
    return null;
}

function enterRoom(roomId, spawn) {
    currentRoomId = roomId;
    const r = rooms[roomId];
    placeAtTile(spawn.col, spawn.row);
    if (onRoomChange) onRoomChange(r);
}

function checkDoor() {
    const room = rooms[currentRoomId];
    const { col, row } = centerTile();
    const t = room.tiles[row]?.[col];
    const name = tileTypeName(t);
    if (!name) return;
    const key = `${currentRoomId}:${name}`;
    const transition = doorTransitions[key];
    if (transition) enterRoom(transition.to, transition.spawn);
}

function update() {
    const { dx, dy } = getMoveVector();
    if (dx === 0 && dy === 0) return;
    const len = Math.hypot(dx, dy);
    const vx = (dx / len) * PLAYER_SPEED;
    const vy = (dy / len) * PLAYER_SPEED;
    resolveMove(rooms[currentRoomId].tiles, player, vx, vy);
    checkDoor();
}

function frame() {
    update();
    render(rooms[currentRoomId], player);
    requestAnimationFrame(frame);
}

export function startEngine(canvas, opts = {}) {
    initRenderer(canvas);
    onRoomChange = opts.onRoomChange || null;
    const start = opts.startRoom || 'kitchen';
    enterRoom(start, rooms[start].spawn);
    requestAnimationFrame(frame);
}
