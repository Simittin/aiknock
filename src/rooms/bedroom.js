import { COLS, ROWS, FLOOR, WALL, DOOR_R } from '../config.js';
import { computeBlocked } from './_helpers.js';

function build() {
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));
    for (let c = 0; c < COLS; c++) { t[0][c] = WALL; t[ROWS - 1][c] = WALL; }
    for (let r = 0; r < ROWS; r++) { t[r][0] = WALL; t[r][COLS - 1] = WALL; }
    // Oturma odasına geçiş (sağ duvar)
    t[6][COLS - 1] = DOOR_R;
    return t;
}

const tiles = build();

// Yatak Odası — geçmiş ve veda. Sıkı dolu, dışa kapalı bir oda hissi.
const furniture = [
    // Merkezi halı — yürünebilir, oda altını sıcak gösterir
    { type: 'rug',          col: 6,  row: 5,  w: 8, h: 4, blocking: false },

    // Sol üst — yatak alanı + komodin + ayna
    { type: 'bed',          col: 1,  row: 1,  w: 3, h: 3 },
    { type: 'nightstand',   col: 4,  row: 2,  w: 1, h: 1 },
    { type: 'curtain',      col: 6,  row: 0,  w: 3, h: 1, blocking: false },
    { type: 'mirror',       col: 9,  row: 1,  w: 1, h: 2 },

    // Üst sağ — gardırop + üstünde raf
    { type: 'shelf',        col: 11, row: 1,  w: 3, h: 1 },
    { type: 'wardrobe',     col: 15, row: 1,  w: 2, h: 3 },
    { type: 'dresser',      col: 17, row: 1,  w: 2, h: 2 },

    // Orta - sağ odadaki gitar standı
    { type: 'guitar_stand', col: 17, row: 4,  w: 2, h: 1 },

    // Sol alt — yazı masası ve sandalye (genç asker, mektupları yazmış)
    { type: 'desk',         col: 1,  row: 8,  w: 3, h: 2 },
    { type: 'chair',        col: 2,  row: 10, w: 1, h: 1 },
    { type: 'floor_lamp',   col: 4,  row: 8,  w: 1, h: 2 },

    // Alt sağ — küçük yan masa + bitki
    { type: 'side_table',   col: 14, row: 9,  w: 2, h: 1 },
    { type: 'plant',        col: 17, row: 9,  w: 2, h: 2 },
];

const objects = [
    { id: 'letter', col: 4,  row: 3 },   // komodinin önüne düşmüş
    { id: 'toy',    col: 8,  row: 7 },   // halının üzerinde
    { id: 'guitar', col: 17, row: 5 },   // gitar standına yaslı
    // Lore Easter egg'leri
    { id: 'movie_ticket', col: 12, row: 8 },
    { id: 'lore_record',  col: 5,  row: 8 },
];

export const bedroom = {
    id: 'bedroom',
    name: 'Yatak Odası',
    tiles,
    objects,
    furniture,
    spawn: { col: 10, row: 6 },
    blocked: computeBlocked(tiles, objects, furniture),
};
