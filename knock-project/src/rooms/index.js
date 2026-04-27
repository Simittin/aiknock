// Oda kayıt defteri. Yeni oda eklemek için dosyasını import et ve burada listele.
import { COLS } from '../config.js';
import { kitchen } from './kitchen.js';
import { hallway } from './hallway.js';

export const rooms = { kitchen, hallway };

// Kapı geçiş tablosu: hangi kapı, hangi odaya, hangi tile'a düşürür?
// Anahtar formatı: `${roomId}:${tileType}`
export const doorTransitions = {
    'kitchen:DOOR_R': { to: 'hallway', spawn: { col: 1, row: 6 } },
    'hallway:DOOR_L': { to: 'kitchen', spawn: { col: COLS - 2, row: 6 } },
};
