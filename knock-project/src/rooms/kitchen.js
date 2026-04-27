import { COLS, ROWS, FLOOR, WALL, DOOR_R } from '../config.js';

function build() {
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));
    // Dış duvarlar
    for (let c = 0; c < COLS; c++) { t[0][c] = WALL; t[ROWS - 1][c] = WALL; }
    for (let r = 0; r < ROWS; r++) { t[r][0] = WALL; t[r][COLS - 1] = WALL; }
    // Tezgâh (üst sol)
    t[1][1] = WALL; t[1][2] = WALL; t[1][3] = WALL; t[1][4] = WALL;
    // Mutfak masası (orta)
    t[4][8] = WALL; t[4][9] = WALL; t[4][10] = WALL;
    t[5][8] = WALL; t[5][9] = WALL; t[5][10] = WALL;
    // Hole geçiş kapısı (sağ duvar)
    t[6][COLS - 1] = DOOR_R;
    return t;
}

export const kitchen = {
    id: 'kitchen',
    name: 'Mutfak',
    tiles: build(),
    spawn: { col: 2, row: 6 },
};
