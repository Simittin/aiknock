import { TILE, COLS, ROWS, VIEW_W, VIEW_H, DISPLAY_W, DISPLAY_H, SPRITE_SIZE, PAL, WALL, DOOR_R, DOOR_L, DOOR_OUT } from '../config.js';
import { objects as OBJECT_DB } from '../objects/index.js';
import { getSprites } from '../assets/sprites.js';
import { isCompleted } from '../state/scores.js';

let ctx = null;
let sprites = null;
let dust = [];

function initDust() {
    dust = [];
    for (let i = 0; i < 15; i++) {
        dust.push({
            x: Math.random() * VIEW_W,
            y: Math.random() * VIEW_H,
            vx: (Math.random() - 0.5) * 0.1,
            vy: -0.05 - Math.random() * 0.1,
            life: Math.random() * Math.PI * 2
        });
    }
}

export function initRenderer(canvas) {
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    canvas.style.width = DISPLAY_W + 'px';
    canvas.style.height = DISPLAY_H + 'px';
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    sprites = getSprites();
    initDust();
}

function drawTile(c, r, t) {
    const x = c * TILE;
    const y = r * TILE;
    if (t === WALL) {
        ctx.drawImage(sprites.tiles.wall, x, y);
    } else if (t === DOOR_R) {
        ctx.drawImage(sprites.tiles.doorR, x, y);
    } else if (t === DOOR_L) {
        ctx.drawImage(sprites.tiles.doorL, x, y);
    } else if (t === DOOR_OUT) {
        ctx.drawImage(sprites.tiles.doorOut, x, y);
    } else {
        // Şahmerdan tarzı dama paterni — küçük varyasyonla yerel doğal görünüm
        const tile = ((c + r) & 1) ? sprites.tiles.floorA : sprites.tiles.floorB;
        ctx.drawImage(tile, x, y);
    }
}

function drawRoom(tiles) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawTile(c, r, tiles[r][c]);
        }
    }
}

function drawObjects(objs) {
    for (const o of objs) {
        const def = OBJECT_DB[o.id];
        if (!def) continue;
        const sprite = sprites.objects[def.kind];
        if (!sprite) continue;
        const done = isCompleted(o.id);
        if (done) ctx.globalAlpha = 0.45;
        ctx.drawImage(sprite, o.col * TILE, o.row * TILE);
        if (done) {
            ctx.globalAlpha = 1;
            // Tamamlanmış nesnenin üstüne küçük tik işareti
            ctx.fillStyle = PAL.brass;
            const x = o.col * TILE;
            const y = o.row * TILE;
            ctx.fillRect(x + 11, y + 11, 1, 1);
            ctx.fillRect(x + 12, y + 12, 1, 1);
            ctx.fillRect(x + 13, y + 11, 1, 1);
            ctx.fillRect(x + 14, y + 10, 1, 1);
        }
        ctx.globalAlpha = 1;
    }
}

function drawPlayer(player) {
    const dir = player.dir;
    const f = player.animFrame;
    if (dir === 'left') {
        const sprite = sprites.player[`right-${f}`];
        ctx.save();
        ctx.translate(player.x + SPRITE_SIZE, player.y - 1);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, 0);
        ctx.restore();
    } else {
        const sprite = sprites.player[`${dir}-${f}`];
        // Sprite 14, çarpışma kutusu 12; 1px sola/yukarı kayık çiz
        ctx.drawImage(sprite, player.x - 1, player.y - 1);
    }
}

function drawHint(obj) {
    let text;
    if (obj.isFinale) {
        text = '[E] CENNETİN KAPISI';
    } else {
        const def = OBJECT_DB[obj.id];
        if (!def) return;
        const done = isCompleted(obj.id);
        text = done ? `[X] TAMAMLANDI` : `[E] ${def.name.toUpperCase()}`;
    }
    const objCx = obj.col * TILE + TILE / 2;
    const objTop = obj.row * TILE;

    ctx.font = 'bold 8px "Courier New", monospace';
    const textW = ctx.measureText(text).width;
    const w = Math.ceil(textW) + 6;
    const h = 11;
    let x = Math.round(objCx - w / 2);
    let y = objTop - h - 1;
    if (y < 1) y = objTop + TILE + 1;
    x = Math.max(1, Math.min(VIEW_W - w - 1, x));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = PAL.brass;
    // Kenarlık
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
    // Metin
    ctx.fillStyle = PAL.paper;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
}

function drawDust() {
    ctx.fillStyle = PAL.paper;
    const now = Date.now();
    for (const p of dust) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = VIEW_W;
        if (p.x > VIEW_W) p.x = 0;
        if (p.y < 0) p.y = VIEW_H;
        
        const alpha = Math.sin(now * 0.001 + p.life) * 0.2 + 0.2;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }
    ctx.globalAlpha = 1.0;
}

export function render(room, player, nearby) {
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawRoom(room.tiles);
    drawObjects(room.objects);
    drawPlayer(player);
    drawDust();
    if (nearby) drawHint(nearby);
}
