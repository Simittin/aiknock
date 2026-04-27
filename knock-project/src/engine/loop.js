import { PLAYER_SPEED, DOOR_R, DOOR_L } from '../config.js';
import { rooms, doorTransitions } from '../rooms/index.js';
import { objects as OBJECT_DB } from '../objects/index.js';
import { player, placeAtTile, centerTile, updateAnim } from './player.js';
import { getMoveVector, consumeKey } from './input.js';
import { resolveMove } from './collision.js';
import { initRenderer, render } from './renderer.js';
import { findInteraction } from './interaction.js';
import { openDialog, isDialogOpen, advanceDialog, closeDialog } from '../ui/dialog.js';
import { getPlayerName } from '../state/profile.js';

let currentRoomId = 'bedroom';
let onRoomChange = null;
let nearby = null;

function tileTypeName(t) {
    if (t === DOOR_R) return 'DOOR_R';
    if (t === DOOR_L) return 'DOOR_L';
    return null;
}

function enterRoom(roomId, spawn) {
    currentRoomId = roomId;
    const r = rooms[roomId];
    placeAtTile(spawn.col, spawn.row);
    nearby = null;
    if (onRoomChange) onRoomChange(r);
}

function checkDoor() {
    const room = rooms[currentRoomId];
    const { col, row } = centerTile();
    const t = room.tiles[row]?.[col];
    const name = tileTypeName(t);
    if (!name) return false;
    const transition = doorTransitions[`${currentRoomId}:${name}`];
    if (transition) {
        enterRoom(transition.to, transition.spawn);
        return true;
    }
    return false;
}

function triggerInteraction(obj) {
    const def = OBJECT_DB[obj.id];
    if (!def) return;
    const name = getPlayerName() || 'asker';
    const pages = def.lore.map((line) => line.replace(/\{name\}/g, name));
    openDialog({ title: def.name, pages });
}

function update() {
    // Diyalog açıkken motor donar — animasyon idle, sadece Enter/Esc dinler
    if (isDialogOpen()) {
        if (consumeKey('enter')) advanceDialog();
        else if (consumeKey('escape')) closeDialog();
        updateAnim(0, 0);
        return;
    }

    const room = rooms[currentRoomId];

    // Hareket
    const { dx, dy } = getMoveVector();
    updateAnim(dx, dy);
    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        const vx = (dx / len) * PLAYER_SPEED;
        const vy = (dy / len) * PLAYER_SPEED;
        resolveMove(room.blocked, player, vx, vy);
        if (checkDoor()) return;
    }

    // Etkileşim
    nearby = findInteraction(rooms[currentRoomId], player);
    if (nearby && consumeKey('e')) {
        triggerInteraction(nearby);
    }
}

function frame() {
    update();
    render(rooms[currentRoomId], player, isDialogOpen() ? null : nearby);
    requestAnimationFrame(frame);
}

export function startEngine(canvas, opts = {}) {
    initRenderer(canvas);
    onRoomChange = opts.onRoomChange || null;
    const start = opts.startRoom || 'bedroom';
    enterRoom(start, rooms[start].spawn);
    requestAnimationFrame(frame);
}
