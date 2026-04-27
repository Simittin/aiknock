import { COLS, ROWS, FLOOR, WALL, DOOR_L } from '../config.js';
import { computeBlocked } from './_helpers.js';

function build() {
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));
    for (let c = 0; c < COLS; c++) { t[0][c] = WALL; t[ROWS - 1][c] = WALL; }
    for (let r = 0; r < ROWS; r++) { t[r][0] = WALL; t[r][COLS - 1] = WALL; }
    // Tezgâh (üst sol)
    t[1][1] = WALL; t[1][2] = WALL; t[1][3] = WALL; t[1][4] = WALL;
    // Buzdolabı
    t[1][16] = WALL; t[2][16] = WALL;
    // Mutfak masası (orta)
    t[5][8] = WALL; t[5][9] = WALL; t[5][10] = WALL;
    t[6][8] = WALL; t[6][9] = WALL; t[6][10] = WALL;
    // Oturma odasına dönüş (sol)
    t[6][0] = DOOR_L;
    return t;
}

const tiles = build();

const objects = [
    { id: 'window', col: 10, row: 2 },   // üst duvara yaslı, fırtına dışarıda
    { id: 'mom',    col: 13, row: 6 },   // masanın yanında, oyuncuyu bekliyor
];

export const kitchen = {
    id: 'kitchen',
    name: 'Mutfak',
    tiles,
    objects,
    spawn: { col: 2, row: 6 },
    blocked: computeBlocked(tiles, objects),
};
