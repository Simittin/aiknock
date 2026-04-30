import { TILE, COLS, ROWS, VIEW_W, VIEW_H, DISPLAY_W, DISPLAY_H, SPRITE_SIZE, PAL, FLOOR, WALL, DOOR_R, DOOR_L, DOOR_OUT } from '../config.js';
import { objects as OBJECT_DB } from '../objects/index.js';
import { getSprites } from '../assets/sprites.js';
import { isCompleted } from '../state/scores.js';
import { getBurden } from '../state/burden.js';

let ctx = null;
let sprites = null;
let dust = [];

/* ── Phantom Trail state ── */
const TRAIL_MAX = 8;
let positionHistory = [];   // [{x, y, dir, animFrame}, ...]

/* ── Lightning flash state ── */
let lightningAlpha = 0;     // fades each frame

/* ── Rain particle pool (kitchen window) ── */
let raindrops = [];

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

let currentSeed = 1;
function setSeed(s) { currentSeed = s; }
function rand() {
    currentSeed = (currentSeed * 16807) % 2147483647;
    return (currentSeed - 1) / 2147483646;
}

function drawFloor(room) {
    setSeed(room.id === 'bedroom' ? 123 : (room.id === 'kitchen' ? 456 : 789));
    
    if (room.id === 'kitchen') {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                ctx.fillStyle = ((c + r) & 1) ? '#8a9a9a' : '#6a7a7a';
                ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
            }
        }
        ctx.save();
        const grad = ctx.createRadialGradient(VIEW_W/2, VIEW_H/2, VIEW_W*0.2, VIEW_W/2, VIEW_H/2, VIEW_W*0.8);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.restore();
    } else {
        ctx.fillStyle = PAL.floorA;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        
        ctx.save();
        const plankH = 8;
        for (let y = 0; y < VIEW_H; y += plankH) {
            let x = ((y / plankH) % 2 === 0) ? 0 : -20;
            while (x < VIEW_W) {
                const w = 20 + rand() * 30;
                const shade = rand() > 0.5 ? PAL.floorA : PAL.floorB;
                ctx.fillStyle = shade;
                ctx.fillRect(x, y, w, plankH);
                
                ctx.strokeStyle = PAL.wallGrain;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(x + 2, y + 2 + rand()*4);
                ctx.quadraticCurveTo(x + w/2, y + rand()*plankH, x + w - 2, y + 2 + rand()*4);
                ctx.stroke();

                ctx.fillStyle = '#0a0708';
                ctx.fillRect(x + 2, y + 2, 1, 1);
                ctx.fillRect(x + w - 3, y + plankH - 3, 1, 1);
                
                ctx.strokeStyle = PAL.floorLine;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, w, plankH);
                
                x += w;
            }
        }
        
        ctx.strokeStyle = 'rgba(200, 180, 150, 0.15)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 40; i++) {
            const sx = rand() * VIEW_W;
            const sy = rand() * VIEW_H;
            const len = 2 + rand() * 6;
            const angle = rand() * Math.PI;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(angle)*len, sy + Math.sin(angle)*len);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    ctx.save();
    const cornerGrad = ctx.createRadialGradient(VIEW_W/2, VIEW_H/2, VIEW_W*0.4, VIEW_W/2, VIEW_H/2, VIEW_W*0.7);
    cornerGrad.addColorStop(0, 'rgba(0,0,0,0)');
    cornerGrad.addColorStop(1, 'rgba(20, 10, 5, 0.6)');
    ctx.fillStyle = cornerGrad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
}

function drawRoomEnhancements(room) {
    ctx.save();
    const time = Date.now();
    if (room.id === 'bedroom') {
        const grad = ctx.createLinearGradient(11 * TILE, TILE, 13 * TILE, 8 * TILE);
        grad.addColorStop(0, 'rgba(200, 220, 255, 0.15)');
        grad.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(10 * TILE, TILE);
        ctx.lineTo(13 * TILE, TILE);
        ctx.lineTo(15 * TILE, 8 * TILE);
        ctx.lineTo(11 * TILE, 8 * TILE);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(10 * TILE, TILE);
        ctx.lineTo(13 * TILE, TILE);
        ctx.lineTo(15 * TILE, 8 * TILE);
        ctx.lineTo(11 * TILE, 8 * TILE);
        ctx.clip();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 20; i++) {
            const dx = (10 * TILE) + ((time * 0.005 + i * 13) % (5 * TILE));
            const dy = TILE + ((time * 0.01 + i * 7) % (7 * TILE));
            ctx.fillRect(dx, dy, 1, 1);
        }
    } else if (room.id === 'living_room') {
        /* ── 4. Dying Fire — burden-reactive fireplace glow ── */
        const fx = 5 * TILE + 24;
        const fy = TILE * 2;
        const burden = getBurden();
        const t = burden / 100;        // 0 = carefree, 1 = crushed

        let radius, pulse, baseAlpha;
        if (burden < 30) {
            // Warm, large, slow-breathing fire
            radius = 80 + (1 - t) * 40;          // big radius at low burden
            pulse = Math.sin(time / 500) * 6;    // slow gentle pulse
            baseAlpha = 0.22;
        } else if (burden > 70) {
            // Dying ember — small, erratic flicker
            radius = 30 + Math.random() * 10;    // tiny + jitter
            pulse = Math.random() * 8 - 4;       // random flicker
            baseAlpha = 0.08 + Math.random() * 0.06;
        } else {
            // Mid range — moderate glow
            radius = 80 - t * 50;
            pulse = Math.sin(time / 300) * 5;
            baseAlpha = 0.18 - t * 0.08;
        }

        const grad = ctx.createRadialGradient(fx, fy, 10 + pulse, fx, fy, radius + pulse * 2);
        grad.addColorStop(0, `rgba(255, 80, 0, ${baseAlpha})`);
        grad.addColorStop(1, 'rgba(255, 80, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (room.id === 'kitchen') {
        /* ── 3. Dynamic Weather — burden-reactive rain + lightning ── */
        const burden = getBurden();
        const t = burden / 100;
        const wx = 10 * TILE;
        const wy = 0 * TILE;
        ctx.beginPath();
        ctx.rect(wx, wy, TILE, TILE);
        ctx.clip();

        // Rain density and speed scale with burden
        const dropCount = Math.floor(4 + t * 14);      // 4–18 drops
        const speed = 0.12 + t * 0.35;                  // vertical velocity multiplier

        ctx.strokeStyle = `rgba(200, 220, 255, ${0.3 + t * 0.3})`;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < dropCount; i++) {
            const rx = wx + ((time * 0.1 + i * 5) % TILE);
            const ry = wy + ((time * speed + i * 7) % TILE);
            const len = 3 + t * 3;    // longer streaks at high burden
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 1, ry + len);
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawBaseboards(tiles) {
    ctx.save();
    ctx.fillStyle = PAL.wallBot;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (tiles[r][c] === WALL) {
                if (r < ROWS - 1 && tiles[r+1][c] === FLOOR) {
                    ctx.fillRect(c * TILE, r * TILE + TILE - 2, TILE, 2);
                }
            }
        }
    }
    ctx.restore();
}

function drawRoomTiles(tiles) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const t = tiles[r][c];
            if (t === WALL) {
                ctx.drawImage(sprites.tiles.wall, c * TILE, r * TILE);
            } else if (t === DOOR_R) {
                ctx.drawImage(sprites.tiles.doorR, c * TILE, r * TILE);
            } else if (t === DOOR_L) {
                ctx.drawImage(sprites.tiles.doorL, c * TILE, r * TILE);
            } else if (t === DOOR_OUT) {
                ctx.drawImage(sprites.tiles.doorOut, c * TILE, r * TILE);
            }
        }
    }
}

function drawWallDecor(room) {
    ctx.save();
    if (room.id === 'living_room') {
        drawPainting(6 * TILE, 0 * TILE + 2, 24, 12);
        drawPainting(16 * TILE, 0 * TILE + 2, 16, 12);
    } else if (room.id === 'bedroom') {
        drawPainting(12 * TILE, 0 * TILE + 2, 20, 12);
    }
    ctx.restore();
}

function drawPainting(x, y, w, h) {
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#e8d8a8';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#7a1a0a';
    ctx.fillRect(x + 4, y + 4, w/2, h/2);
    ctx.fillStyle = '#3a4868';
    ctx.fillRect(x + w/2 + 1, y + 6, w/3, h/3);
}

function drawNotes(x, y) {
    ctx.shadowColor = 'transparent';
    for (let i=0; i<3; i++) {
        ctx.save();
        ctx.translate(x + rand()*8, y + rand()*8);
        ctx.rotate((rand() - 0.5));
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(-3, -4, 6, 8);
        ctx.fillStyle = '#808080';
        ctx.fillRect(-2, -2, 4, 1);
        ctx.fillRect(-2, 0, 4, 1);
        ctx.fillRect(-2, 2, 4, 1);
        ctx.restore();
    }
}

function drawMug(x, y) {
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#201000';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI*2);
    ctx.fill();
}

function drawRug(x, y, w, h) {
    ctx.fillStyle = PAL.shawl;
    ctx.fillRect(x, y, w, h);
    
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const grad = ctx.createRadialGradient(x + w/2, y + h/2, 2, x + w/2, y + h/2, Math.min(w, h)/2);
    grad.addColorStop(0, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    
    ctx.strokeStyle = PAL.paper;
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y);
    ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawBed(x, y, w, h) {
    ctx.fillStyle = PAL.walnut;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, y + 2, w - 4, h - 4);
    ctx.clip();
    
    ctx.fillStyle = PAL.denim;
    ctx.fillRect(x + 2, y + h/2, w - 4, h/2 - 2);
    
    ctx.translate(x + w/2, y + h/2);
    ctx.rotate(0.2);
    ctx.fillStyle = '#4a5878';
    ctx.fillRect(-w/2, -h/4, w, h/2);
    ctx.rotate(-0.4);
    ctx.fillStyle = PAL.shawl;
    ctx.fillRect(-w/3, 0, w/2, h/2);
    ctx.restore();
    
    ctx.fillStyle = '#fff';
    ctx.save();
    ctx.translate(x + 6, y + 5);
    ctx.rotate(0.05);
    ctx.fillRect(0, 0, w - 12, h/4);
    ctx.restore();
}

function drawNightstand(x, y, w, h) {
    ctx.fillStyle = PAL.walnut;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PAL.wallBot;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.arc(x + 8, y + 8, 3, 0, Math.PI*2); ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createRadialGradient(x + 8, y + 8, 2, x + 8, y + 8, 20);
    grad.addColorStop(0, 'rgba(255, 200, 0, 0.4)');
    grad.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 12, y - 12, w + 24, h + 24);
    ctx.restore();
}

function drawWardrobe(x, y, w, h) {
    ctx.fillStyle = PAL.cherry;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x + 2, y + 2, w/2 - 2, h - 4);
    ctx.strokeRect(x + w/2, y + 2, w/2 - 2, h - 4);
}

function drawCounter(x, y, w, h) {
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(x, y, w, h);
    
    // Stove
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 4, y + 2, 14, h - 4);
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(x + 8, y + 6, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 14, y + 6, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8, y + 10, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 14, y + 10, 2, 0, Math.PI*2); ctx.fill();
    
    // Sink
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(x + 24, y + 2, 12, h - 4);
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 25, y + 3, 10, h - 6);
    ctx.fillStyle = '#ccc';
    ctx.fillRect(x + 29, y, 2, 4); // Faucet
    
    // Cutting board
    ctx.fillStyle = PAL.wallTop;
    ctx.fillRect(x + 42, y + 2, 10, h - 4);
    
    // Unwashed dishes inside sink
    ctx.fillStyle = '#eee';
    ctx.beginPath(); ctx.arc(x + 30, y + h/2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 28, y + h/2 - 2, 2.5, 0, Math.PI*2); ctx.fill();
}

function drawFridge(x, y, w, h) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(x + 2, y + 2, w - 4, h/2 - 2);
    ctx.fillRect(x + 2, y + h/2 + 1, w - 4, h/2 - 3);
}

function drawTable(x, y, w, h) {
    // Chairs underneath
    ctx.fillStyle = PAL.wallBot; // Backrest
    ctx.fillRect(x + w/2 - 6, y - 6, 12, 4); // Top chair
    ctx.fillRect(x + w/2 - 6, y + h + 2, 12, 4); // Bottom chair
    ctx.fillRect(x + w + 2, y + h/2 - 6, 4, 12); // Right chair
    
    ctx.fillStyle = PAL.wallMid; // Seat
    ctx.fillRect(x + w/2 - 6, y - 2, 12, 6); // Top seat
    ctx.fillRect(x + w/2 - 6, y + h - 4, 12, 6); // Bottom seat
    ctx.fillRect(x + w - 4, y + h/2 - 6, 6, 12); // Right seat

    // Table top
    ctx.fillStyle = PAL.wallTop;
    ctx.fillRect(x, y, w, h);
    
    // Clutter
    drawNotes(x + 4, y + 4);
    drawMug(x + w - 10, y + 10);
}

function drawAshtray(x, y) {
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
    
    const time = Date.now();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.sin(time/300)*2, y - 4, x + Math.sin(time/400)*3, y - 8);
    ctx.stroke();
}

function drawCoffeeTable(x, y, w, h) {
    ctx.fillStyle = PAL.cherry;
    ctx.fillRect(x, y, w, h);
    drawNotes(x + 2, y + 2);
    drawAshtray(x + 10, y + 6);
}

function drawCouch(x, y, w, h) {
    ctx.fillStyle = PAL.plush;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PAL.wallBot;
    ctx.lineWidth = 2;
    
    if (w > h) {
        ctx.fillRect(x, y, 6, h);
        ctx.fillRect(x + w - 6, y, 6, h);
        for (let i = 0; i < w/TILE; i++) {
            ctx.strokeRect(x + i*TILE + 2, y + 2, TILE - 4, h - 4);
        }
    } else {
        ctx.fillRect(x, y, w, 6);
        ctx.fillRect(x, y + h - 6, w, 6);
        for (let i = 0; i < h/TILE; i++) {
            ctx.strokeRect(x + 2, y + i*TILE + 2, w - 4, TILE - 4);
        }
    }
}

function drawDesk(x, y, w, h) {
    ctx.fillStyle = PAL.walnut;
    ctx.fillRect(x, y, w, h);
    
    ctx.fillStyle = PAL.wallBot;
    ctx.fillRect(x + w/2 - 6, y + h, 12, 4);
    ctx.fillStyle = PAL.wallMid;
    ctx.fillRect(x + w/2 - 6, y + h - 6, 12, 6);
    
    drawNotes(x + 4, y + 4);
}

function drawSideTable(x, y, w, h) {
    ctx.fillStyle = PAL.cherry;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PAL.wallBot;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
}

function drawGuitarStand(x, y, w, h) {
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#111';
    ctx.fillRect(x + 2, y + h - 4, w - 4, 4);
}

function drawPlant(x, y, w, h) {
    ctx.fillStyle = '#6a3a18';
    ctx.fillRect(x + 4, y + h - 10, w - 8, 10);
    
    ctx.fillStyle = '#1a4a2a';
    ctx.beginPath(); ctx.arc(x + 8, y + h - 15, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2a5a3a';
    ctx.beginPath(); ctx.arc(x + 4, y + h - 12, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a5a2a';
    ctx.beginPath(); ctx.arc(x + 12, y + h - 12, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8, y + h - 20, 6, 0, Math.PI*2); ctx.fill();
}

function drawBookshelf(x, y, w, h) {
    ctx.fillStyle = PAL.walnut;
    ctx.fillRect(x, y, w, h);
    ctx.shadowColor = 'transparent';
    const colors = ['#5a1a1a', '#1a2a5a', '#1a4a2a', '#a08050'];
    let bx = x + 2;
    while (bx < x + w - 4) {
        const bw = 2 + rand() * 3;
        const bh = 8 + rand() * 6;
        ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
        const tilt = rand() > 0.8 ? (rand() - 0.5) * 0.4 : 0;
        ctx.save();
        ctx.translate(bx, y + h - 2);
        ctx.rotate(tilt);
        ctx.fillRect(0, -bh, bw, bh);
        ctx.restore();
        bx += bw + 1;
    }
}

function drawFireplace(x, y, w, h) {
    ctx.fillStyle = '#404040';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + w/4, y + 4, w/2, h - 4);
    
    ctx.fillStyle = '#ff8800';
    for(let i=0; i<5; i++) {
        ctx.fillRect(x + w/4 + 2 + rand()*(w/2 - 4), y + h - 2 - rand()*3, 1 + rand()*2, 1 + rand()*2);
    }
}

function drawFurniture(furniture) {
    if (!furniture) return;
    for (const f of furniture) {
        setSeed(f.col * 1000 + f.row);
        ctx.save();
        const px = f.col * TILE;
        const py = f.row * TILE;
        const pw = f.w * TILE;
        const ph = f.h * TILE;
        
        if (f.type !== 'rug') {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        switch (f.type) {
            case 'bed': drawBed(px, py, pw, ph); break;
            case 'nightstand': drawNightstand(px, py, pw, ph); break;
            case 'wardrobe': drawWardrobe(px, py, pw, ph); break;
            case 'rug': drawRug(px, py, pw, ph); break;
            case 'counter': drawCounter(px, py, pw, ph); break;
            case 'fridge': drawFridge(px, py, pw, ph); break;
            case 'table': drawTable(px, py, pw, ph); break;
            case 'coffee_table': drawCoffeeTable(px, py, pw, ph); break;
            case 'couch': drawCouch(px, py, pw, ph); break;
            case 'bookshelf': drawBookshelf(px, py, pw, ph); break;
            case 'fireplace': drawFireplace(px, py, pw, ph); break;
            case 'desk': drawDesk(px, py, pw, ph); break;
            case 'side_table': drawSideTable(px, py, pw, ph); break;
            case 'guitar_stand': drawGuitarStand(px, py, pw, ph); break;
            case 'plant': drawPlant(px, py, pw, ph); break;
        }
        ctx.restore();
    }
}

function drawFloorClutter(room) {
    ctx.save();
    if (room.id === 'bedroom') {
        setSeed(1001);
        const cx = 5 * TILE;
        const cy = 4 * TILE;
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.translate(cx + rand()*20, cy + rand()*20);
            ctx.rotate(rand() * Math.PI);
            ctx.fillStyle = 'rgba(240, 240, 240, 0.7)';
            ctx.fillRect(-3, -3, 6, 6);
            ctx.restore();
        }
    } else if (room.id === 'kitchen') {
        const sx = 6 * TILE;
        const sy = 4 * TILE;
        ctx.fillStyle = 'rgba(60, 30, 15, 0.6)';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + 10, sy - 5, sx + 20, sy + 5);
        ctx.quadraticCurveTo(sx + 25, sy + 20, sx + 15, sy + 25);
        ctx.quadraticCurveTo(sx - 5, sy + 15, sx, sy);
        ctx.fill();
    }
    ctx.restore();
}

function drawRoom(room) {
    drawFloor(room);
    drawBaseboards(room.tiles);
    drawRoomTiles(room.tiles);
    drawWallDecor(room);
    drawFloorClutter(room);
    drawFurniture(room.furniture);
}

function drawObjects(objs) {
    for (const o of objs) {
        const def = OBJECT_DB[o.id];
        if (!def) continue;
        const sprite = sprites.objects[def.kind];
        if (!sprite) continue;
        // Lore nesneleri hep tam opasite — tamamlanma kavramı yok
        const done = !def.lore && isCompleted(o.id);
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

    /* ── 1. Phantom Trail — dragging soul at burden > 50 ── */
    const burden = getBurden();
    if (burden > 50) {
        const intensity = (burden - 50) / 50; // 0→1 over burden 50–100
        const len = positionHistory.length;
        for (let i = 0; i < len; i++) {
            const ghost = positionHistory[i];
            // Oldest = most transparent, newest = slightly visible
            const alphaBase = 0.3 * intensity;
            const alpha = alphaBase * (i / len);
            if (alpha < 0.01) continue;
            ctx.save();
            ctx.globalAlpha = alpha;
            if (ghost.dir === 'left') {
                const spr = sprites.player[`right-${ghost.animFrame}`];
                ctx.translate(ghost.x + SPRITE_SIZE, ghost.y - 1);
                ctx.scale(-1, 1);
                ctx.drawImage(spr, 0, 0);
            } else {
                const spr = sprites.player[`${ghost.dir}-${ghost.animFrame}`];
                ctx.drawImage(spr, ghost.x - 1, ghost.y - 1);
            }
            ctx.restore();
        }
    }

    // Record position for trail (always record so trail is ready when burden crosses 50)
    positionHistory.push({ x: player.x, y: player.y, dir: player.dir, animFrame: player.animFrame });
    if (positionHistory.length > TRAIL_MAX) positionHistory.shift();

    // Draw actual player
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
        // Lore nesneleri her zaman [E] ile etkileşilebilir
        if (def.lore) {
            text = `[E] ${def.name.toUpperCase()}`;
        } else {
            const done = isCompleted(obj.id);
            text = done ? `[X] TAMAMLANDI` : `[E] ${def.name.toUpperCase()}`;
        }
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

function drawVignette() {
    const score = getBurden();
    if (score < 10) return; // Düşük yükte temiz ekran

    /* ── 2b. Breathing Vignette — expands/contracts with burden ── */
    const breathe = score > 30
        ? Math.sin(Date.now() / 300) * (score / 100) * 0.06
        : 0;

    const alpha = (score / 100) * 0.6; // Max 0.6 opacity
    const innerR = VIEW_W * (0.2 - breathe);
    const outerR = VIEW_W * (0.8 + breathe);
    const gradient = ctx.createRadialGradient(
        VIEW_W / 2, VIEW_H / 2, Math.max(0, innerR),
        VIEW_W / 2, VIEW_H / 2, outerR
    );
    
    // Yük arttıkça renk siyahtan kan kırmızısına kayar
    const color = score > 70 ? 'rgba(40, 0, 0, ' : 'rgba(0, 0, 0, ';
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, color + alpha + ')');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
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
    const burden = getBurden();

    /* ── 2a. Anxiety Camera Shake — subtle jitter at burden > 70 ── */
    const shaking = burden > 70;
    if (shaking) {
        ctx.save();
        const intensity = ((burden - 70) / 30);   // 0→1 over 70–100
        const sx = (Math.random() * 2 - 1) * intensity * 1.5;
        const sy = (Math.random() * 2 - 1) * intensity * 1.5;
        ctx.translate(sx, sy);
    }

    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawRoom(room);
    drawObjects(room.objects);
    drawRoomEnhancements(room);

    /* ── 3b. Lightning Flash — kitchen only, burden > 80 ── */
    if (room.id === 'kitchen' && burden > 80) {
        // ~1% chance per frame to trigger a flash
        if (lightningAlpha <= 0 && Math.random() < 0.01) {
            lightningAlpha = 0.35 + Math.random() * 0.15;  // 0.35–0.5
        }
        if (lightningAlpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(220, 230, 255, ${lightningAlpha})`;
            ctx.fillRect(0, 0, VIEW_W, VIEW_H);
            ctx.restore();
            lightningAlpha -= 0.04;  // fade over ~10 frames
            if (lightningAlpha < 0) lightningAlpha = 0;
        }
    } else if (room.id !== 'kitchen') {
        lightningAlpha = 0; // reset when leaving kitchen
    }

    drawPlayer(player);
    drawDust();
    drawVignette();

    if (shaking) ctx.restore();

    if (nearby) drawHint(nearby);
}
