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

const furniture = [
    { type: 'counter', col: 1, row: 1, w: 4, h: 1 },
    { type: 'fridge', col: 16, row: 1, w: 1, h: 2 },
    { type: 'table', col: 8, row: 5, w: 3, h: 2 }
];

const objects = [
    { id: 'window', col: 10, row: 0 },   // üst duvara flush
    { id: 'mom',    col: 9, row: 4 },    // masadaki sandalyenin arkasında
    // Lore Easter egg
    { id: 'old_radio', col: 3, row: 1 },  // tezgahın üzerinde
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
