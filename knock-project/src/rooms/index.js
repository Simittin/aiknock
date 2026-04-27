import { COLS } from '../config.js';
import { bedroom }    from './bedroom.js';
import { livingRoom } from './living_room.js';
import { kitchen }    from './kitchen.js';

export const rooms = {
    bedroom,
    living_room: livingRoom,
    kitchen,
};

// Hub yapısı: oturma odası merkez. Yatak odası ↔ Oturma Odası ↔ Mutfak.
// Her geçiş, hedef odanın kapısının iç tarafına spawn eder.
export const doorTransitions = {
    'bedroom:DOOR_R':     { to: 'living_room', spawn: { col: 1,         row: 6 } },
    'living_room:DOOR_L': { to: 'bedroom',     spawn: { col: COLS - 2,  row: 6 } },
    'living_room:DOOR_R': { to: 'kitchen',     spawn: { col: 1,         row: 6 } },
    'kitchen:DOOR_L':     { to: 'living_room', spawn: { col: COLS - 2,  row: 6 } },
};
