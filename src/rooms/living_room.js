import { COLS, ROWS, FLOOR, WALL, DOOR_L, DOOR_R, DOOR_OUT } from '../config.js';
import { computeBlocked } from './_helpers.js';

function build() {
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));
    for (let c = 0; c < COLS; c++) { t[0][c] = WALL; t[ROWS - 1][c] = WALL; }
    for (let r = 0; r < ROWS; r++) { t[r][0] = WALL; t[r][COLS - 1] = WALL; }
    // Sehpa (orta)
    t[5][9] = WALL; t[5][10] = WALL;
    t[6][9] = WALL; t[6][10] = WALL;
    // Koltuk (alt sol)
    t[9][3] = WALL; t[9][4] = WALL; t[9][5] = WALL; t[9][6] = WALL;
    // Kitaplık (alt sağ)
    t[9][13] = WALL; t[9][14] = WALL; t[9][15] = WALL; t[9][16] = WALL;
    // Yatak odasına dönüş (sol)
    t[6][0] = DOOR_L;
    // Mutfağa geçiş (sağ)
    t[6][COLS - 1] = DOOR_R;
    // CENNETİN KAPISI — üst duvar ortası, finale tetikleyicisi
    t[0][10] = DOOR_OUT;
    return t;
}

const tiles = build();

// Faz 2'de "dış kapı" finali henüz yok; eklendiğinde buradan çıkılacak.
const objects = [
    { id: 'gun',           col: 10, row: 2 },  // üst duvara yaslı, asılı silah
    { id: 'badge',         col: 11, row: 5 },  // sehpanın yanında parıldıyor
    { id: 'record_player', col: 14, row: 8 },  // kitaplığın yanında
];

export const livingRoom = {
    id: 'living_room',
    name: 'Oturma Odası',
    tiles,
    objects,
    spawn: { col: 10, row: 6 },
    blocked: computeBlocked(tiles, objects),
};
