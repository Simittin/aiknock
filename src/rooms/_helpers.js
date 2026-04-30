import { WALL, DOOR_OUT } from '../config.js';
import { objects as OBJECT_DB } from '../objects/index.js';

// Duvar tile'ları + bloklayıcı objelerin birleşim grid'i. Collision modülü
// tek bir 2D bool dizisinden okur — tile + obje farkı sızmaz.
// DOOR_OUT (Heaven's Door) normal koşulda blokludur; finale auto-walk
// collision'ı bypass ederek geçer.
export function computeBlocked(tiles, objects, furniture = []) {
    const grid = tiles.map((row) => row.map((t) => t === WALL || t === DOOR_OUT));
    for (const o of objects) {
        const def = OBJECT_DB[o.id];
        if (def && def.blocking) grid[o.row][o.col] = true;
    }
    for (const f of furniture) {
        if (f.blocking !== false) {
            for (let r = f.row; r < f.row + f.h; r++) {
                for (let c = f.col; c < f.col + f.w; c++) {
                    if (grid[r] !== undefined && grid[r][c] !== undefined) {
                        grid[r][c] = true;
                    }
                }
            }
        }
    }
    return grid;
}
