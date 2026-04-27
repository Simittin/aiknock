import { WALL } from '../config.js';
import { objects as OBJECT_DB } from '../objects/index.js';

// Duvar tile'ları + bloklayıcı objelerin birleşim grid'i. Collision modülü
// tek bir 2D bool dizisinden okur — tile + obje farkı sızmaz.
export function computeBlocked(tiles, objects) {
    const grid = tiles.map((row) => row.map((t) => t === WALL));
    for (const o of objects) {
        const def = OBJECT_DB[o.id];
        if (def && def.blocking) grid[o.row][o.col] = true;
    }
    return grid;
}
