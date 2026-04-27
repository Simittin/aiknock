import { TILE, PLAYER_SIZE } from '../config.js';

export const player = {
    x: 0,
    y: 0,
    size: PLAYER_SIZE,
};

export function placeAtTile(col, row) {
    player.x = col * TILE + (TILE - player.size) / 2;
    player.y = row * TILE + (TILE - player.size) / 2;
}

export function centerTile() {
    return {
        col: Math.floor((player.x + player.size / 2) / TILE),
        row: Math.floor((player.y + player.size / 2) / TILE),
    };
}
