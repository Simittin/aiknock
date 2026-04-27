import { TILE, COLS, ROWS, WALL } from '../config.js';

// tiles: aktif odanın 2D tile dizisi (rows x cols)
export function tileAt(tiles, px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return WALL;
    return tiles[r][c];
}

function blocks(t) {
    return t === WALL;
}

function cornersBlocked(tiles, x, y, size) {
    const x2 = x + size - 1;
    const y2 = y + size - 1;
    return (
        blocks(tileAt(tiles, x,  y))  ||
        blocks(tileAt(tiles, x2, y))  ||
        blocks(tileAt(tiles, x,  y2)) ||
        blocks(tileAt(tiles, x2, y2))
    );
}

// X ve Y eksenlerini ayrı çözer — duvara değerken kayma doğal hisseder.
export function resolveMove(tiles, entity, dx, dy) {
    const nx = entity.x + dx;
    if (!cornersBlocked(tiles, nx, entity.y, entity.size)) {
        entity.x = nx;
    }
    const ny = entity.y + dy;
    if (!cornersBlocked(tiles, entity.x, ny, entity.size)) {
        entity.y = ny;
    }
}
