import { TILE, COLS, ROWS, VIEW_W, VIEW_H, WALL, DOOR_R, DOOR_L } from '../config.js';

let ctx = null;

export function initRenderer(canvas) {
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
}

function drawTile(c, r, t) {
    const x = c * TILE;
    const y = r * TILE;

    if (t === WALL) {
        ctx.fillStyle = '#0d4d0d';
        ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = '#33ff33';
        ctx.fillRect(x + 1, y + 1, TILE - 2, 2);
        ctx.fillStyle = '#1a8a1a';
        ctx.fillRect(x + 1, y + TILE - 3, TILE - 2, 2);
        return;
    }

    if (t === DOOR_R || t === DOOR_L) {
        ctx.fillStyle = '#3a2400';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = '#ffaa33';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
        ctx.fillStyle = '#ffaa33';
        const knobX = t === DOOR_R ? x + TILE - 9 : x + 6;
        ctx.fillRect(knobX, y + TILE / 2 - 1, 3, 3);
        return;
    }

    // FLOOR — hafif grid noktası
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(x + TILE / 2 - 1, y + TILE / 2 - 1, 2, 2);
}

function drawRoom(tiles) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawTile(c, r, tiles[r][c]);
        }
    }
}

function drawPlayer(player) {
    ctx.fillStyle = '#c8ffc8';
    ctx.fillRect(player.x, player.y, player.size, player.size);
    // gözler
    ctx.fillStyle = '#0d4d0d';
    ctx.fillRect(player.x + 5, player.y + 7, 4, 4);
    ctx.fillRect(player.x + player.size - 9, player.y + 7, 4, 4);
    // ağız
    ctx.fillRect(player.x + 6, player.y + player.size - 8, player.size - 12, 2);
}

export function render(room, player) {
    ctx.fillStyle = '#020a02';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawRoom(room.tiles);
    drawPlayer(player);
}
