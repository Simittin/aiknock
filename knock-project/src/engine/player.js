import { TILE, PLAYER_SIZE, SPRITE_SIZE, WALK_TICKS } from '../config.js';

export const player = {
    x: 0,
    y: 0,
    size: PLAYER_SIZE,
    spriteSize: SPRITE_SIZE,
    dir: 'down',          // 'up' | 'down' | 'left' | 'right'
    walking: false,
    animTime: 0,
    animFrame: 0,         // 0 = idle, 1 = step A, 2 = step B
};

export function placeAtTile(col, row) {
    player.x = col * TILE + (TILE - player.size) / 2;
    player.y = row * TILE + (TILE - player.size) / 2;
    player.dir = 'down';
    player.walking = false;
    player.animTime = 0;
    player.animFrame = 0;
}

export function centerTile() {
    return {
        col: Math.floor((player.x + player.size / 2) / TILE),
        row: Math.floor((player.y + player.size / 2) / TILE),
    };
}

// Hareket girdisine göre yön + animasyon karesini günceller.
export function updateAnim(dx, dy) {
    const moving = dx !== 0 || dy !== 0;
    player.walking = moving;

    if (moving) {
        // Dikey hareket önceliği yatay üzerinde — daha doğal hisseder
        if (Math.abs(dy) >= Math.abs(dx)) {
            player.dir = dy > 0 ? 'down' : 'up';
        } else {
            player.dir = dx > 0 ? 'right' : 'left';
        }
        player.animTime++;
        if (player.animTime >= WALK_TICKS) {
            player.animTime = 0;
            player.animFrame = player.animFrame === 1 ? 2 : 1;
        }
    } else {
        player.animTime = 0;
        player.animFrame = 0;
    }
}
