import { TILE } from '../config.js';

// Oyuncuya en yakın etkileşim nesnesini bul. Manhattan komşuluğu (üzerinde +
// 4 yön) — köşeler dahil değil; klasik RPG hissini korur.
export function findInteraction(room, player) {
    const cx = player.x + player.size / 2;
    const cy = player.y + player.size / 2;
    const pc = Math.floor(cx / TILE);
    const pr = Math.floor(cy / TILE);

    const offsets = [
        [0, 0],   // üzerinde (overlap durumu)
        [0, -1],  // üstündeki
        [0, 1],
        [-1, 0],
        [1, 0],
    ];

    for (const [dc, dr] of offsets) {
        const c = pc + dc;
        const r = pr + dr;
        const obj = room.objects.find((o) => o.col === c && o.row === r);
        if (obj) return obj;
    }
    return null;
}
