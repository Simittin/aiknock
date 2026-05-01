// Native tile boyutu 16px, 20x12 grid -> 320x192 native canvas.
// CSS 2x büyütür (640x384) -> klasik retro pixel hissiyatı + crisp scaling.

export const TILE = 16;
export const COLS = 20;
export const ROWS = 12;
export const VIEW_W = TILE * COLS;   // 320
export const VIEW_H = TILE * ROWS;   // 192
export const SCALE = 2;
export const DISPLAY_W = VIEW_W * SCALE; // 640
export const DISPLAY_H = VIEW_H * SCALE; // 384

// Tile türleri
export const FLOOR    = 0;
export const WALL     = 1;
export const DOOR_R   = 2;
export const DOOR_L   = 3;
export const DOOR_OUT = 4;  // Heaven's Door - finale tetikleyici

// Oyuncu
export const PLAYER_SIZE  = 12;   // çarpışma kutusu (sprite 14, 1px boşluk her yan)
export const SPRITE_SIZE  = 14;
export const PLAYER_SPEED = 1.0;  // px/frame (native, 16px tile)

// Animasyon
export const WALK_TICKS = 7;      // her N tick'te bir kare değiştir

// Tema paleti - dusty western + folk melankoli karışımı
export const PAL = {
    bg:        '#0a0708',
    floorA:    '#5a3a1e',
    floorB:    '#4a2e16',
    floorLine: '#2e1c0a',
    wallTop:   '#8a5a30',
    wallMid:   '#5a3618',
    wallBot:   '#2a1808',
    wallGrain: '#3a2210',
    doorWood:  '#2a1808',
    doorEdge:  '#5a2818',
    brass:     '#c89846',
    brassDim:  '#7a5818',
    paper:     '#e8d8a8',
    ink:       '#3a1a08',
    blood:     '#7a1a0a',
    rust:      '#6a3a18',
    steel:     '#5a5a6a',
    steelHi:   '#a8a8b8',
    walnut:    '#3a1808',
    cherry:    '#6a1a0a',
    plush:     '#7a4a1a',
    plushHi:   '#a86838',
    skin:      '#d8a878',
    skinShade: '#a87858',
    hair:      '#2a1808',
    eye:       '#1a0a08',
    denim:     '#3a4868',
    denimD:    '#28324a',
    pants:     '#1a1828',
    boot:      '#0a0608',
    shawl:     '#7a4858',
    shawlHi:   '#a87078',
    storm:     '#1a2038',
    stormHi:   '#3a4868',
    rain:      '#a8b8d8',
    night:     '#0a0a18',
};
