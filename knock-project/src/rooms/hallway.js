import { COLS, ROWS, FLOOR, WALL, DOOR_L } from '../config.js';

function build() {
    const t = Array.from({ length: ROWS }, () => Array(COLS).fill(FLOOR));
    for (let c = 0; c < COLS; c++) { t[0][c] = WALL; t[ROWS - 1][c] = WALL; }
    for (let r = 0; r < ROWS; r++) { t[r][0] = WALL; t[r][COLS - 1] = WALL; }
    // Sütunlar
    t[3][6] = WALL; t[8][6] = WALL;
    t[3][13] = WALL; t[8][13] = WALL;
    // Mutfağa dönüş kapısı (sol duvar)
    t[6][0] = DOOR_L;
    return t;
}

export const hallway = {
    id: 'hallway',
    name: 'Hol',
    tiles: build(),
    spawn: { col: 17, row: 6 },
};
