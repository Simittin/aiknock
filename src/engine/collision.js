import { TILE, COLS, ROWS } from '../config.js';

// blocked: oda yüklenirken hesaplanmış 2D bool grid (duvarlar + bloklayıcı objeler).
function isBlockedPx(blocked, px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    return blocked[r][c];
}

function cornersBlocked(blocked, x, y, size) {
    const x2 = x + size - 1;
    const y2 = y + size - 1;
    return (
        isBlockedPx(blocked, x,  y)  ||
        isBlockedPx(blocked, x2, y)  ||
        isBlockedPx(blocked, x,  y2) ||
        isBlockedPx(blocked, x2, y2)
    );
}

export function resolveMove(blocked, entity, dx, dy) {
    const nx = entity.x + dx;
    if (!cornersBlocked(blocked, nx, entity.y, entity.size)) {
        entity.x = nx;
    }
    const ny = entity.y + dy;
    if (!cornersBlocked(blocked, entity.x, ny, entity.size)) {
        entity.y = ny;
    }
}
