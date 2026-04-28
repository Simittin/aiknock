// Faz 4: Cennetin Kapısı finali. İki bitiş, burden eşiği 50.
//
// Akış:
//   triggerFinale(player, doorTile)
//     -> 7/7 yansıma var mı? Yoksa kilitli mesajı, return.
//     -> Burden < 50: "light" — normal hızda yürü, beyaza fade, sakin metin
//     -> Burden >= 50: "heavy" — sürünerek yürü, kara/kan kırmızıya fade,
//        shake/glitch, ağır metin
//   Cutscene başladığı an oyuncu input ve hareket kilitlenir, sonsuza dek
//   pasif kalır (oyun bitti).

import { TILE, PLAYER_SIZE, WALK_TICKS } from '../config.js';
import { getBurden } from '../state/burden.js';
import { getCompletedCount } from '../state/scores.js';
import * as Audio from '../audio/audio.js';

const TOTAL_OBJECTS = 7;
const HEAVY_THRESHOLD = 50;

let active = false;
let phase = 'idle';      // 'walk' | 'hold' | 'fade' | 'text' | 'done'
let target = null;
let speed = 0;
let playerRef = null;
let isHeavy = false;
let phaseTimer = 0;

const TEXTS = {
    light: {
        en: '"Knock, knock, knockin\' on heaven\'s door..."',
        tr: '"Çal, çal, çal cennetin kapısını..."',
    },
    heavy: {
        en: '"It\'s gettin\' dark, too dark to see..."',
        tr: '"Karanlık çöküyor, artık görmek imkânsız..."',
    },
};

export function isFinaleActive() { return active; }

export function startFinaleAttempt(player, doorTile) {
    if (active) return;
    const done = getCompletedCount();
    if (done < TOTAL_OBJECTS) {
        showLockedMessage(done);
        return;
    }
    startCutscene(player, doorTile);
}

function showLockedMessage(done) {
    const el = document.getElementById('finale-locked');
    if (!el) return;
    el.textContent = `Henüz vakti gelmedi.   ${done}/${TOTAL_OBJECTS} yansıma tamamlandı.`;
    el.classList.add('visible');
    clearTimeout(showLockedMessage._t);
    showLockedMessage._t = setTimeout(() => el.classList.remove('visible'), 2400);
}

function startCutscene(player, doorTile) {
    active = true;
    phase = 'walk';
    playerRef = player;
    isHeavy = getBurden() >= HEAVY_THRESHOLD;
    speed = isHeavy ? 0.18 : 0.85;
    target = {
        x: doorTile.col * TILE + (TILE - PLAYER_SIZE) / 2,
        y: doorTile.row * TILE + (TILE - PLAYER_SIZE) / 2,
    };

    const container = document.querySelector('.crt');
    if (isHeavy) container.classList.add('ending-heavy');
}

// Loop her frame'de çağırır — finale aktifse hareketi devraldırır.
export function tickFinale() {
    if (!active) return;

    if (phase === 'walk') {
        const p = playerRef;
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < speed + 0.01) {
            p.x = target.x;
            p.y = target.y;
            p.walking = false;
            p.animFrame = 0;
            phase = 'hold';
            phaseTimer = isHeavy ? 70 : 35;
            return;
        }
        p.x += (dx / dist) * speed;
        p.y += (dy / dist) * speed;
        if (Math.abs(dy) >= Math.abs(dx)) p.dir = dy < 0 ? 'up' : 'down';
        else                              p.dir = dx > 0 ? 'right' : 'left';
        p.walking = true;
        p.animTime++;
        if (p.animTime >= WALK_TICKS) {
            p.animTime = 0;
            p.animFrame = p.animFrame === 1 ? 2 : 1;
        }
        return;
    }

    if (phase === 'hold') {
        if (--phaseTimer <= 0) {
            phase = 'fade';
            const overlay = document.getElementById('ending-overlay');
            overlay.classList.add(isHeavy ? 'heavy' : 'light');
            overlay.classList.add('visible');
            phaseTimer = isHeavy ? 240 : 150;  // ~4s heavy, ~2.5s light @60fps
            // Ambient sesleri yavaşça sustur, kapı çalış teması başlasın
            Audio.fadeOutAmbient(isHeavy ? 4 : 2.5);
            Audio.playKnockTheme();
        }
        return;
    }

    if (phase === 'fade') {
        if (--phaseTimer <= 0) {
            const t = TEXTS[isHeavy ? 'heavy' : 'light'];
            document.getElementById('ending-text-en').textContent = t.en;
            document.getElementById('ending-text-tr').textContent = t.tr;
            document.getElementById('ending-text').classList.add('visible');
            phase = 'text';
            phaseTimer = 300; // 5sn @ 60fps -> credits roll başlasın
        }
        return;
    }

    if (phase === 'text') {
        if (--phaseTimer <= 0) {
            startCredits();
            phase = 'credits';
        }
        return;
    }

    // 'credits' / 'done' — credits CSS animasyonu çalışıyor, sonsuza dek kilitli
}

function startCredits() {
    // Heavy ending shake'i kapat — credits okunabilsin
    const container = document.querySelector('.crt');
    container.classList.remove('ending-heavy');
    document.getElementById('credits-overlay').classList.add('visible');
}
