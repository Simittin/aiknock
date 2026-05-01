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

// Oturma Odası — hub. Şiddet ve kimlik. Yoğun mobilya, hayatın orta katmanı.
const furniture = [
    // Şömine bölgesi (sol üst — silah orada asılı)
    { type: 'fireplace',    col: 4,  row: 1,  w: 3, h: 1 },
    { type: 'side_table',   col: 2,  row: 1,  w: 1, h: 1 },
    { type: 'floor_lamp',   col: 7,  row: 1,  w: 1, h: 2 },

    // Sağ üst köşe — bitki + Cennetin Kapısı'na giden alan boş tutulur
    { type: 'plant',        col: 17, row: 1,  w: 2, h: 2 },
    { type: 'curtain',      col: 12, row: 0,  w: 5, h: 1, blocking: false },

    // Merkez — halı, sehpa, kanepe (oturma alanı)
    { type: 'rug',          col: 5,  row: 4,  w: 9, h: 5, blocking: false },
    { type: 'coffee_table', col: 9,  row: 5,  w: 3, h: 2 },
    { type: 'couch',        col: 7,  row: 5,  w: 1, h: 2 },   // sol koltuk
    { type: 'couch',        col: 13, row: 5,  w: 1, h: 2 },   // sağ koltuk
    { type: 'couch',        col: 8,  row: 8,  w: 5, h: 1 },   // ana kanepe

    // Sol alt — TV kombinesi (1973 atmosferi)
    { type: 'tv_set',       col: 2,  row: 8,  w: 2, h: 2 },
    { type: 'side_table',   col: 5,  row: 9,  w: 1, h: 1 },

    // Sağ alt — kitaplık + plak çalar
    { type: 'bookshelf',    col: 14, row: 9,  w: 4, h: 1 },
    { type: 'chair',        col: 18, row: 8,  w: 1, h: 2 },
];

const objects = [
    { id: 'gun',           col: 5,  row: 0 },   // şömine üstünde, duvarda asılı
    { id: 'badge',         col: 10, row: 5 },   // sehpa üzerinde parıldıyor
    { id: 'record_player', col: 15, row: 9 },   // kitaplığın üstünde
    // Lore Easter egg'leri
    { id: 'faded_photo',   col: 3,  row: 0 },   // duvar
    { id: 'dusty_boots',   col: 18, row: 8 },   // sandalyenin yanında
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
