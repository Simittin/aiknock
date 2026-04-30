import { COLS, ROWS, FLOOR, WALL, DOOR_L, DOOR_R, DOOR_OUT } from '../config.js';
import { computeBlocked } from './_helpers.js';

function build() {
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));
    for (let c = 0; c < COLS; c++) { t[0][c] = WALL; t[ROWS - 1][c] = WALL; }
    for (let r = 0; r < ROWS; r++) { t[r][0] = WALL; t[r][COLS - 1] = WALL; }
    // Yatak odasına dönüş (sol)
    t[6][0] = DOOR_L;
    // Mutfağa geçiş (sağ)
    t[6][COLS - 1] = DOOR_R;
    // CENNETİN KAPISI — üst duvar ortası, finale tetikleyicisi
    t[0][10] = DOOR_OUT;
    return t;
}

const tiles = build();

const furniture = [
    { type: 'rug', col: 7, row: 4, w: 7, h: 4, blocking: false },
    { type: 'coffee_table', col: 9, row: 5, w: 3, h: 2 },
    { type: 'couch', col: 8, row: 8, w: 5, h: 1 }, 
    { type: 'couch', col: 7, row: 5, w: 1, h: 2 }, // left armchair
    { type: 'couch', col: 13, row: 5, w: 1, h: 2 }, // right armchair
    { type: 'bookshelf', col: 13, row: 9, w: 4, h: 1 },
    { type: 'fireplace', col: 5, row: 1, w: 3, h: 1 },
    { type: 'plant', col: 17, row: 1, w: 2, h: 2 } // Corner filler
];

// Faz 2'de "dış kapı" finali henüz yok; eklendiğinde buradan çıkılacak.
const objects = [
    { id: 'gun',           col: 6, row: 0 },  // ON FIREPLACE WALL
    { id: 'badge',         col: 10, row: 5 },  // ON COFFEE TABLE
    { id: 'record_player', col: 14, row: 9 },  // ON BOOKSHELF
    // Lore Easter egg'leri
    { id: 'faded_photo',   col: 4,  row: 0 },  // ON WALL
    { id: 'dusty_boots',   col: 18, row: 8 },  // floor
];

export const livingRoom = {
    id: 'living_room',
    name: 'Oturma Odası',
    tiles,
    objects,
    furniture,
    spawn: { col: 10, row: 6 },
    blocked: computeBlocked(tiles, objects, furniture),
};
