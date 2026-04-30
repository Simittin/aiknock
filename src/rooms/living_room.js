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
    { type: 'rug', col: 7, row: 4, w: 6, h: 4, blocking: false },
    { type: 'coffee_table', col: 9, row: 5, w: 2, h: 2 },
    { type: 'couch', col: 3, row: 9, w: 4, h: 1 },
    { type: 'bookshelf', col: 13, row: 9, w: 4, h: 1 },
    { type: 'fireplace', col: 5, row: 1, w: 3, h: 1 }
];

// Faz 2'de "dış kapı" finali henüz yok; eklendiğinde buradan çıkılacak.
const objects = [
    { id: 'gun',           col: 10, row: 2 },  // üst duvara yaslı, asılı silah
    { id: 'badge',         col: 11, row: 5 },  // sehpanın yanında parıldıyor
    { id: 'record_player', col: 14, row: 8 },  // kitaplığın yanında
    // Lore Easter egg'leri
    { id: 'faded_photo',   col: 4,  row: 2 },  // üst duvarda solmuş fotoğraf
    { id: 'dusty_boots',   col: 16, row: 8 },  // kitaplığın yanında çizmeler
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
