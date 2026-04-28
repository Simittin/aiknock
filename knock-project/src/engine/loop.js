import { PLAYER_SPEED, DOOR_R, DOOR_L } from '../config.js';
import { rooms, doorTransitions } from '../rooms/index.js';
import { player, placeAtTile, centerTile, updateAnim } from './player.js';
import { getMoveVector, consumeKey } from './input.js';
import { resolveMove } from './collision.js';
import { initRenderer, render } from './renderer.js';
import { findInteraction } from './interaction.js';
import { openConversation, isDialogOpen, closeDialog } from '../ui/dialog.js';
import { getSpeedMultiplier } from '../state/burden.js';
import { isCompleted } from '../state/scores.js';
import { isFinaleActive, startFinaleAttempt, tickFinale } from '../ui/finale.js';

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

function update() {
    // Finale aktifse: cutscene devraldı, oyuncu input/hareket yok.
    if (isFinaleActive()) {
        tickFinale();
        return;
    }

    // Diyalog açıkken motor donar — input modülü kendi Enter/Esc'ini yakalar.
    if (isDialogOpen()) {
        if (consumeKey('escape')) closeDialog();
        updateAnim(0, 0);
        return;
    }

    const room = rooms[currentRoomId];

    // Hareket — Burden formülü: speed = base * max(0.15, 1 - burden/100)
    const { dx, dy } = getMoveVector();
    updateAnim(dx, dy);
    if (dx !== 0 || dy !== 0) {
        const speed = PLAYER_SPEED * getSpeedMultiplier();
        const len = Math.hypot(dx, dy);
        const vx = (dx / len) * speed;
        const vy = (dy / len) * speed;
        resolveMove(room.blocked, player, vx, vy);
        if (checkDoor()) return;
    }

    // Etkileşim
    nearby = findInteraction(rooms[currentRoomId], player);
    if (nearby && consumeKey('e')) {
        if (nearby.isFinale) {
            startFinaleAttempt(player, nearby);
        } else if (!isCompleted(nearby.id)) {
            openConversation({ objectId: nearby.id });
        }
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
