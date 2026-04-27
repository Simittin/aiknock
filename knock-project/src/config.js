// Oyun sabitleri — tüm modüller buradan okur. 32px tile, 20x12 grid = 640x384 canvas.

export const TILE = 32;
export const COLS = 20;
export const ROWS = 12;
export const VIEW_W = TILE * COLS;
export const VIEW_H = TILE * ROWS;

// Tile türleri
export const FLOOR  = 0;
export const WALL   = 1;
export const DOOR_R = 2; // sağa açılan kapı
export const DOOR_L = 3; // sola açılan kapı

// Oyuncu
export const PLAYER_SIZE = 26;
export const PLAYER_SPEED = 2.4; // px/frame — Faz 2'de Burden'a bağlanacak
