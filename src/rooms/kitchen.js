import { COLS, ROWS, FLOOR, WALL, DOOR_L } from '../config.js';
import { computeBlocked } from './_helpers.js';

function build() {
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));
    for (let c = 0; c < COLS; c++) { t[0][c] = WALL; t[ROWS - 1][c] = WALL; }
    for (let r = 0; r < ROWS; r++) { t[r][0] = WALL; t[r][COLS - 1] = WALL; }
    // Oturma odasına dönüş (sol)
    t[6][0] = DOOR_L;
    return t;
}

const tiles = build();

// Mutfak — anne, fırtına. Çalışan bir kadının alanı, dolu ama düzenli.
const furniture = [
    // Üst duvar boyunca tezgâh, ocak, lavabo (drawCounter zaten bunları içeriyor)
    { type: 'counter',      col: 1,  row: 1,  w: 5, h: 1 },

    // Pencere üstüne perde (window object yine col 10, row 0'da)
    { type: 'curtain',      col: 8,  row: 0,  w: 5, h: 1, blocking: false },

    // Buzdolabı (sağ üst)
    { type: 'fridge',       col: 18, row: 1,  w: 1, h: 2 },

    // Kiler — sağda dik dolap
    { type: 'dresser',      col: 18, row: 4,  w: 1, h: 3 },

    // Ortada yemek masası + sandalyeler (drawTable kendi sandalyelerini çiziyor)
    { type: 'rug',          col: 6,  row: 4,  w: 7, h: 4, blocking: false },
    { type: 'table',        col: 8,  row: 5,  w: 3, h: 2 },

    // Sol alt — yardımcı raf + bitki + yan masa
    { type: 'shelf',        col: 14, row: 1,  w: 3, h: 1 },
    { type: 'plant',        col: 1,  row: 9,  w: 2, h: 2 },
    { type: 'side_table',   col: 4,  row: 9,  w: 1, h: 1 },

    // Sağ alt — sandalye köşesinde
    { type: 'chair',        col: 17, row: 9,  w: 1, h: 1 },
];

const objects = [
    { id: 'window', col: 10, row: 0 },   // üst duvarda, fırtına dışarıda
    { id: 'mom',    col: 13, row: 5 },   // masanın yanında, oğluna bakıyor
    // Lore Easter egg
    { id: 'old_radio', col: 3, row: 1 }, // tezgâh üstünde, statik cızırtı
];

export const kitchen = {
    id: 'kitchen',
    name: 'Mutfak',
    tiles,
    objects,
    furniture,
    spawn: { col: 2, row: 6 },
    blocked: computeBlocked(tiles, objects, furniture),
};
