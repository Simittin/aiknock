import { COLS, ROWS, FLOOR, WALL, DOOR_R } from '../config.js';
import { computeBlocked } from './_helpers.js';

function build() {
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));
    for (let c = 0; c < COLS; c++) { t[0][c] = WALL; t[ROWS - 1][c] = WALL; }
    for (let r = 0; r < ROWS; r++) { t[r][0] = WALL; t[r][COLS - 1] = WALL; }
    // Yatak (sol üst, 2x3 blok)
    t[2][2] = WALL; t[2][3] = WALL; t[2][4] = WALL;
    t[3][2] = WALL; t[3][3] = WALL; t[3][4] = WALL;
    // Komodin
    t[2][6] = WALL;
    // Dolap (sağ üst köşe duvarına yaslı)
    t[1][16] = WALL; t[1][17] = WALL;
    t[2][16] = WALL; t[2][17] = WALL;
    // Halı kenarı dekoratif değil; gerek yok.
    // Oturma odasına geçiş (sağ duvar)
    t[6][COLS - 1] = DOOR_R;
    return t;
}

const tiles = build();

const objects = [
    { id: 'letter', col: 5,  row: 3 },  // yatağın yanında, komodine yakın
    { id: 'toy',    col: 10, row: 8 },  // odanın ortasında, yere düşmüş
    { id: 'guitar', col: 17, row: 4 },  // dolabın altında duvara yaslı
    // Lore Easter egg'leri
    { id: 'movie_ticket', col: 8,  row: 3 },  // komodinin yakınında, masada bilet
    { id: 'lore_record',  col: 3,  row: 8 },  // sol alt köşede sessiz pikap
];

export const bedroom = {
    id: 'bedroom',
    name: 'Yatak Odası',
    tiles,
    objects,
    spawn: { col: 10, row: 6 },
    blocked: computeBlocked(tiles, objects),
};
