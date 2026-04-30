// Offscreen sprite fabrikası — tüm karakter ve nesne sprite'ları başlangıçta
// bir kez çizilir, render sırasında drawImage ile blit edilir.
//
// Tüm pixel sanat fillRect ile elle çizildi (Phase 2 anlaşması: a — kanvas
// içi). Palet config.js'te merkezileştirildi ki sonradan tek yerden tema
// ayarlanabilsin.

import { SPRITE_SIZE, TILE, PAL } from '../config.js';

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

// --- Karakter sprite'ları ---
function drawPlayerDown(g, frame) {
    // Saç + kafa
    g.fillStyle = PAL.hair;
    g.fillRect(3, 1, 8, 3);
    g.fillRect(2, 2, 1, 3);
    g.fillRect(11, 2, 1, 3);
    g.fillStyle = PAL.skin;
    g.fillRect(4, 4, 6, 3);
    // Gözler
    g.fillStyle = PAL.eye;
    g.fillRect(5, 5, 1, 1);
    g.fillRect(8, 5, 1, 1);
    // Boyun
    g.fillStyle = PAL.skinShade;
    g.fillRect(6, 7, 2, 1);
    // Gövde — denim ceket
    g.fillStyle = PAL.denim;
    g.fillRect(3, 7, 8, 4);
    g.fillStyle = PAL.denimD;
    g.fillRect(7, 7, 1, 4); // orta dikiş
    g.fillRect(3, 10, 8, 1);
    // Kollar
    g.fillStyle = PAL.denimD;
    g.fillRect(2, 8, 1, 3);
    g.fillRect(11, 8, 1, 3);
    // Bacaklar (yürüyüş kareleri)
    g.fillStyle = PAL.pants;
    if (frame === 1) {
        g.fillRect(3, 11, 3, 2);
        g.fillRect(7, 11, 4, 2);
    } else if (frame === 2) {
        g.fillRect(3, 11, 4, 2);
        g.fillRect(8, 11, 3, 2);
    } else {
        g.fillRect(4, 11, 2, 2);
        g.fillRect(8, 11, 2, 2);
    }
    // Bot
    g.fillStyle = PAL.boot;
    g.fillRect(3, 13, 3, 1);
    g.fillRect(8, 13, 3, 1);
}

function drawPlayerUp(g, frame) {
    // Sırttan görüntü — saç dolu
    g.fillStyle = PAL.hair;
    g.fillRect(2, 1, 10, 6);
    g.fillStyle = PAL.skinShade;
    g.fillRect(5, 6, 4, 1); // ense
    // Gövde
    g.fillStyle = PAL.denim;
    g.fillRect(3, 7, 8, 4);
    g.fillStyle = PAL.denimD;
    g.fillRect(2, 8, 1, 3);
    g.fillRect(11, 8, 1, 3);
    // Bacaklar
    g.fillStyle = PAL.pants;
    if (frame === 1) {
        g.fillRect(3, 11, 4, 2);
        g.fillRect(8, 11, 3, 2);
    } else if (frame === 2) {
        g.fillRect(3, 11, 3, 2);
        g.fillRect(7, 11, 4, 2);
    } else {
        g.fillRect(4, 11, 2, 2);
        g.fillRect(8, 11, 2, 2);
    }
    g.fillStyle = PAL.boot;
    g.fillRect(3, 13, 3, 1);
    g.fillRect(8, 13, 3, 1);
}

// Sağa bakan profil — sol için draw sırasında flip edilir
function drawPlayerRight(g, frame) {
    g.fillStyle = PAL.hair;
    g.fillRect(3, 1, 7, 5);
    g.fillRect(2, 3, 1, 3); // ense saçı
    g.fillStyle = PAL.skin;
    g.fillRect(7, 4, 4, 3);
    g.fillStyle = PAL.eye;
    g.fillRect(9, 5, 1, 1);
    g.fillStyle = PAL.skinShade;
    g.fillRect(7, 7, 2, 1);
    // Gövde
    g.fillStyle = PAL.denim;
    g.fillRect(3, 7, 7, 4);
    g.fillStyle = PAL.denimD;
    // Kollar — yürüyüş kareleri salınımı
    if (frame === 1) {
        g.fillRect(2, 7, 1, 3);
        g.fillRect(10, 8, 1, 3);
    } else if (frame === 2) {
        g.fillRect(3, 8, 1, 3);
        g.fillRect(9, 7, 1, 3);
    } else {
        g.fillRect(2, 8, 1, 3);
        g.fillRect(10, 8, 1, 3);
    }
    // Bacaklar
    g.fillStyle = PAL.pants;
    if (frame === 1) {
        g.fillRect(3, 11, 3, 2);
        g.fillRect(7, 11, 3, 2);
    } else if (frame === 2) {
        g.fillRect(4, 11, 3, 2);
        g.fillRect(8, 11, 3, 2);
    } else {
        g.fillRect(4, 11, 2, 2);
        g.fillRect(7, 11, 2, 2);
    }
    g.fillStyle = PAL.boot;
    g.fillRect(3, 13, 3, 1);
    g.fillRect(7, 13, 3, 1);
}

function buildPlayerSprites() {
    const set = {};
    for (const frame of [0, 1, 2]) {
        const down  = makeCanvas(SPRITE_SIZE, SPRITE_SIZE);
        const up    = makeCanvas(SPRITE_SIZE, SPRITE_SIZE);
        const right = makeCanvas(SPRITE_SIZE, SPRITE_SIZE);
        drawPlayerDown(down.getContext('2d'), frame);
        drawPlayerUp(up.getContext('2d'), frame);
        drawPlayerRight(right.getContext('2d'), frame);
        set[`down-${frame}`]  = down;
        set[`up-${frame}`]    = up;
        set[`right-${frame}`] = right;
        // 'left' sprite'ı right'ın yatay aynası — drawer flip eder
    }
    return set;
}

// --- Nesne sprite'ları (16x16 her biri) ---
function drawLetter(g) {
    g.fillStyle = PAL.paper;
    g.fillRect(2, 4, 12, 9);
    // Katlama gölgesi
    g.fillStyle = '#c8b888';
    g.fillRect(2, 4, 12, 1);
    // Yazılar
    g.fillStyle = PAL.ink;
    g.fillRect(4, 6, 6, 1);
    g.fillRect(4, 8, 8, 1);
    g.fillRect(4, 10, 5, 1);
    // Kırmızı mum mührü
    g.fillStyle = PAL.blood;
    g.fillRect(11, 10, 3, 3);
    g.fillStyle = '#a83a1a';
    g.fillRect(12, 11, 1, 1);
    // Çerçeve
    g.fillStyle = '#8a7858';
    g.fillRect(2, 13, 12, 1);
}

function drawToy(g) {
    // Oyuncak ayı — yıpranmış
    g.fillStyle = PAL.plush;
    g.fillRect(4, 5, 8, 8);     // gövde
    g.fillRect(2, 4, 3, 3);     // sol kulak
    g.fillRect(11, 4, 3, 3);    // sağ kulak
    g.fillRect(5, 13, 2, 2);    // sol bacak
    g.fillRect(9, 13, 2, 2);    // sağ bacak
    g.fillStyle = PAL.plushHi;
    g.fillRect(5, 6, 2, 1);     // hafif highlight
    g.fillRect(9, 6, 2, 1);
    // Yüz
    g.fillStyle = PAL.eye;
    g.fillRect(6, 7, 1, 1);
    g.fillRect(9, 7, 1, 1);
    g.fillRect(7, 9, 2, 1);
    // Yıpranma — sökük dikiş
    g.fillStyle = '#3a2008';
    g.fillRect(8, 11, 1, 1);
    g.fillRect(7, 12, 1, 1);
}

function drawGuitar(g) {
    // Cherry akustik gitar — yan yatık
    g.fillStyle = PAL.cherry;
    // Sap
    g.fillRect(10, 2, 4, 8);
    // Gövde armudu
    g.fillRect(3, 8, 11, 7);
    g.fillRect(2, 9, 1, 5);
    g.fillRect(14, 9, 1, 5);
    g.fillStyle = PAL.walnut;
    // Ses deliği
    g.fillRect(7, 11, 3, 2);
    // Köprü
    g.fillRect(11, 11, 2, 2);
    // Burgular
    g.fillStyle = PAL.brass;
    g.fillRect(13, 2, 1, 1);
    g.fillRect(13, 4, 1, 1);
    g.fillRect(13, 6, 1, 1);
    // Teller
    g.fillStyle = '#d8c898';
    g.fillRect(11, 3, 1, 11);
    g.fillRect(12, 3, 1, 11);
}

function drawGun(g) {
    // Eski tüfek — duvarda asılı, yan görünüm
    g.fillStyle = PAL.steel;
    g.fillRect(1, 7, 14, 2);   // namlu + gövde
    g.fillStyle = PAL.steelHi;
    g.fillRect(1, 7, 14, 1);   // üst highlight
    // Kabze
    g.fillStyle = PAL.walnut;
    g.fillRect(11, 9, 4, 4);
    g.fillRect(13, 13, 2, 2);
    // Tetik
    g.fillStyle = PAL.steel;
    g.fillRect(10, 9, 1, 2);
    // Pas lekeleri
    g.fillStyle = PAL.rust;
    g.fillRect(4, 8, 2, 1);
    g.fillRect(8, 7, 1, 1);
}

function drawBadge(g) {
    // Pirinç şerif yıldızı
    const cx = 8, cy = 8;
    g.fillStyle = PAL.brass;
    g.beginPath();
    for (let i = 0; i < 5; i++) {
        const a1 = -Math.PI / 2 + i * (2 * Math.PI / 5);
        const a2 = a1 + Math.PI / 5;
        const p1x = cx + Math.cos(a1) * 6;
        const p1y = cy + Math.sin(a1) * 6;
        const p2x = cx + Math.cos(a2) * 2.5;
        const p2y = cy + Math.sin(a2) * 2.5;
        if (i === 0) g.moveTo(p1x, p1y);
        else g.lineTo(p1x, p1y);
        g.lineTo(p2x, p2y);
    }
    g.closePath();
    g.fill();
    // Merkez parıltı
    g.fillStyle = PAL.brassDim;
    g.fillRect(cx - 1, cy - 1, 2, 2);
    g.fillStyle = '#f8d878';
    g.fillRect(cx - 2, cy - 2, 1, 1);
}

function drawWindow(g) {
    // Fırtınalı gökyüzü — uzun kara bulut
    g.fillStyle = PAL.storm;
    g.fillRect(2, 2, 12, 12);
    g.fillStyle = PAL.night;
    g.fillRect(2, 2, 12, 4);    // kara bulut
    g.fillStyle = PAL.stormHi;
    g.fillRect(2, 6, 12, 1);    // bulut alt kenarı
    // Çerçeve
    g.fillStyle = PAL.walnut;
    g.fillRect(1, 1, 14, 1);
    g.fillRect(1, 14, 14, 1);
    g.fillRect(1, 1, 1, 14);
    g.fillRect(14, 1, 1, 14);
    // Çapraz çubuk
    g.fillRect(7, 2, 1, 12);
    g.fillRect(2, 7, 12, 1);
    // Yağmur damlaları
    g.fillStyle = PAL.rain;
    g.fillRect(4, 9, 1, 2);
    g.fillRect(10, 11, 1, 2);
    g.fillRect(12, 8, 1, 2);
    g.fillRect(5, 12, 1, 2);
}

function drawMom(g) {
    // Anne — şal ile, üzgün durumda
    // Saç (toplu)
    g.fillStyle = PAL.hair;
    g.fillRect(4, 1, 8, 3);
    g.fillRect(3, 2, 1, 3);
    g.fillRect(12, 2, 1, 3);
    // Yüz
    g.fillStyle = PAL.skin;
    g.fillRect(5, 4, 6, 4);
    // Gözler — yorgun
    g.fillStyle = PAL.eye;
    g.fillRect(6, 5, 1, 1);
    g.fillRect(9, 5, 1, 1);
    g.fillStyle = PAL.skinShade;
    g.fillRect(6, 6, 1, 1);
    g.fillRect(9, 6, 1, 1);
    // Ağız
    g.fillStyle = PAL.blood;
    g.fillRect(7, 7, 2, 1);
    // Şal — omuzlardan dökülen
    g.fillStyle = PAL.shawl;
    g.fillRect(2, 8, 12, 6);
    g.fillRect(3, 7, 10, 1);
    g.fillStyle = PAL.shawlHi;
    g.fillRect(2, 8, 12, 1);
    // Şalın deseni
    g.fillStyle = '#5a2838';
    g.fillRect(4, 10, 1, 1);
    g.fillRect(8, 11, 1, 1);
    g.fillRect(11, 10, 1, 1);
    // Etek alt
    g.fillStyle = '#3a2028';
    g.fillRect(2, 14, 12, 2);
}

function drawRecordPlayer(g) {
    // Eski bir pikap — ceviz kasa
    g.fillStyle = PAL.walnut;
    g.fillRect(2, 6, 12, 8);
    g.fillStyle = PAL.brassDim;
    g.fillRect(2, 6, 12, 1);    // üst kenar
    // Plak (siyah dairemsi)
    g.fillStyle = PAL.bg;
    g.fillRect(4, 7, 6, 6);
    g.fillStyle = '#1a1a1a';
    g.fillRect(5, 8, 4, 4);
    // İğne kolu
    g.fillStyle = PAL.steelHi;
    g.fillRect(11, 7, 1, 5);
    g.fillRect(9, 11, 2, 1);
    // Düğmeler
    g.fillStyle = PAL.brass;
    g.fillRect(3, 11, 1, 1);
    g.fillRect(5, 11, 1, 1);
}

// --- LORE NESNE SPRİTE'LARI ---

function drawMovieTicket(g) {
    // Yıpranmış sinema bileti
    g.fillStyle = PAL.paper;
    g.fillRect(2, 4, 12, 8);
    // Kenar yıpranma — koyu köşeler
    g.fillStyle = '#b8a878';
    g.fillRect(2, 4, 2, 1);
    g.fillRect(12, 11, 2, 1);
    // Perforasyon (delikli kesişim çizgisi)
    g.fillStyle = PAL.floorA;
    g.fillRect(10, 4, 1, 1);
    g.fillRect(10, 6, 1, 1);
    g.fillRect(10, 8, 1, 1);
    g.fillRect(10, 10, 1, 1);
    // Yazılar
    g.fillStyle = PAL.ink;
    g.fillRect(3, 5, 5, 1);
    g.fillRect(3, 7, 6, 1);
    g.fillRect(3, 9, 4, 1);
    // Küçük film şeridi ikonu (sağ kısım)
    g.fillStyle = PAL.walnut;
    g.fillRect(11, 5, 2, 5);
    g.fillStyle = '#f8d878';
    g.fillRect(12, 6, 1, 1);
    g.fillRect(12, 8, 1, 1);
}

function drawLoreRecord(g) {
    // Sessiz plak çalar — iğne durmuş
    g.fillStyle = PAL.walnut;
    g.fillRect(2, 7, 12, 7);
    g.fillStyle = '#2a1a0a';
    g.fillRect(2, 7, 12, 1);
    // Plak (koyu daire)
    g.fillStyle = '#0a0808';
    g.fillRect(4, 8, 7, 5);
    g.fillStyle = '#1a1a1a';
    g.fillRect(5, 9, 5, 3);
    // Etiket (kırmızı merkez)
    g.fillStyle = PAL.blood;
    g.fillRect(7, 10, 1, 1);
    // İğne kolu — kalmış, plak üzerinde
    g.fillStyle = PAL.steel;
    g.fillRect(12, 8, 1, 4);
    g.fillRect(10, 11, 2, 1);
    // Çizikler (yıpranma)
    g.fillStyle = '#2a2a2a';
    g.fillRect(5, 10, 3, 1);
}

function drawFadedPhoto(g) {
    // Solmuş fotoğraf — sepia çerçeve
    g.fillStyle = PAL.walnut;
    g.fillRect(2, 2, 12, 12);
    // Fotoğraf içi (solmuş sepia)
    g.fillStyle = '#a89068';
    g.fillRect(3, 3, 10, 10);
    // İki adam silüeti
    g.fillStyle = '#6a5838';
    g.fillRect(5, 5, 2, 5);   // sol adam
    g.fillRect(9, 5, 2, 5);   // sağ adam
    // Kafalar
    g.fillStyle = '#7a6848';
    g.fillRect(5, 4, 2, 1);
    g.fillRect(9, 4, 2, 1);
    // Rozet parlıltısı (sol adamın göğsü)
    g.fillStyle = '#c8a858';
    g.fillRect(5, 6, 1, 1);
    // Solma efekti — köşelerde ağarma
    g.fillStyle = '#c8b888';
    g.fillRect(3, 3, 2, 1);
    g.fillRect(11, 11, 2, 1);
}

function drawDustyBoots(g) {
    // Eski deri çizmeler
    // Sol çizme
    g.fillStyle = '#3a2008';
    g.fillRect(2, 5, 4, 8);    // gövde
    g.fillRect(1, 13, 5, 2);   // taban
    g.fillStyle = '#2a1808';
    g.fillRect(2, 5, 4, 1);    // üst kenar
    g.fillStyle = PAL.rust;
    g.fillRect(3, 8, 2, 1);    // deri kırışığı
    // Sağ çizme
    g.fillStyle = '#3a2008';
    g.fillRect(9, 6, 4, 7);    // gövde (hafif yan yatmış)
    g.fillRect(8, 13, 6, 2);   // taban
    g.fillStyle = '#2a1808';
    g.fillRect(9, 6, 4, 1);
    g.fillStyle = PAL.rust;
    g.fillRect(10, 9, 2, 1);   // deri kırışığı
    // Toz parçacıkları
    g.fillStyle = '#8a7a5a';
    g.fillRect(1, 15, 1, 1);
    g.fillRect(6, 14, 1, 1);
    g.fillRect(14, 15, 1, 1);
}

function drawOldRadio(g) {
    // Eski tüp radyo
    g.fillStyle = PAL.walnut;
    g.fillRect(2, 4, 12, 10);
    // Üst kenar süs
    g.fillStyle = '#4a2a10';
    g.fillRect(2, 4, 12, 1);
    // Hoparlör ızgarası (sol kısım)
    g.fillStyle = PAL.floorLine;
    g.fillRect(3, 6, 5, 6);
    g.fillStyle = '#3a2a18';
    g.fillRect(4, 7, 1, 1);
    g.fillRect(6, 7, 1, 1);
    g.fillRect(4, 9, 1, 1);
    g.fillRect(6, 9, 1, 1);
    g.fillRect(4, 11, 1, 1);
    g.fillRect(6, 11, 1, 1);
    // Kadran paneli (sağ kısım)
    g.fillStyle = '#1a1208';
    g.fillRect(9, 6, 4, 4);
    // Kadran iğnesi
    g.fillStyle = PAL.brass;
    g.fillRect(10, 7, 1, 1);
    g.fillRect(11, 8, 1, 1);
    // Ayar düğmeleri
    g.fillStyle = PAL.brassDim;
    g.fillRect(9, 11, 2, 2);
    g.fillRect(12, 11, 2, 2);
    // Cızırtı görünümü — kadran içi nokta
    g.fillStyle = '#f8d878';
    g.fillRect(10, 9, 1, 1);
}

function buildObjectSprites() {
    const map = {
        letter: drawLetter,
        toy:    drawToy,
        guitar: drawGuitar,
        gun:    drawGun,
        badge:  drawBadge,
        window: drawWindow,
        record_player: drawRecordPlayer,
        npc:    drawMom,
        // Lore Easter egg sprite'ları
        movie_ticket:  drawMovieTicket,
        lore_record:   drawLoreRecord,
        faded_photo:   drawFadedPhoto,
        dusty_boots:   drawDustyBoots,
        old_radio:     drawOldRadio,
    };
    const out = {};
    for (const [kind, fn] of Object.entries(map)) {
        const c = makeCanvas(TILE, TILE);
        fn(c.getContext('2d'));
        out[kind] = c;
    }
    return out;
}

// --- Tile sprite'ları ---
function drawWallTile(g) {
    // Ahşap lambri
    g.fillStyle = PAL.wallMid;
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = PAL.wallTop;
    g.fillRect(0, 0, TILE, 2);
    g.fillStyle = PAL.wallBot;
    g.fillRect(0, TILE - 2, TILE, 2);
    // Dikey ahşap çizgileri
    g.fillStyle = PAL.wallGrain;
    g.fillRect(4,  2, 1, TILE - 4);
    g.fillRect(11, 2, 1, TILE - 4);
    // Damar dokusu
    g.fillStyle = PAL.wallBot;
    g.fillRect(2,  6, 1, 1);
    g.fillRect(13, 9, 1, 1);
    g.fillRect(7,  4, 1, 1);
}

function drawFloorTileA(g) {
    g.fillStyle = PAL.floorA;
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = PAL.floorLine;
    g.fillRect(0, TILE - 1, TILE, 1);
    g.fillStyle = PAL.floorB;
    g.fillRect(3, 4, 1, 1);
    g.fillRect(11, 11, 1, 1);
}

function drawFloorTileB(g) {
    g.fillStyle = PAL.floorB;
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = PAL.floorLine;
    g.fillRect(0, TILE - 1, TILE, 1);
    g.fillStyle = PAL.floorA;
    g.fillRect(7, 5, 1, 1);
    g.fillRect(13, 12, 1, 1);
}

function drawDoor(g, leftSide) {
    // Çerçeve
    g.fillStyle = PAL.doorEdge;
    g.fillRect(1, 0, TILE - 2, TILE);
    // Kapı tahtası
    g.fillStyle = PAL.doorWood;
    g.fillRect(2, 1, TILE - 4, TILE - 2);
    // Yatay kemer
    g.fillStyle = PAL.doorEdge;
    g.fillRect(2, 6, TILE - 4, 1);
    g.fillRect(2, 11, TILE - 4, 1);
    // Pirinç tokmak
    g.fillStyle = PAL.brass;
    const knobX = leftSide ? 3 : TILE - 5;
    g.fillRect(knobX, 8, 2, 2);
    g.fillStyle = PAL.brassDim;
    g.fillRect(knobX, 9, 1, 1);
}

function drawHeavenDoor(g) {
    // Cennetin Kapısı — pirinç çerçeveli, ışıltılı, üst duvar ortasında
    g.fillStyle = PAL.brass;
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = PAL.doorWood;
    g.fillRect(2, 2, TILE - 4, TILE - 4);
    // Pirinç süsler — köşe perçinleri
    g.fillStyle = PAL.brass;
    g.fillRect(3, 3, 1, 1);
    g.fillRect(TILE - 4, 3, 1, 1);
    g.fillRect(3, TILE - 4, 1, 1);
    g.fillRect(TILE - 4, TILE - 4, 1, 1);
    // Orta dikey haç çizgisi
    g.fillStyle = PAL.brassDim;
    g.fillRect(TILE / 2 - 1, 2, 1, TILE - 4);
    g.fillRect(2, TILE / 2 - 1, TILE - 4, 1);
    // Hale — üst kenar boyunca parıltı
    g.fillStyle = '#f8d878';
    g.fillRect(0, 0, TILE, 1);
    g.fillRect(0, 0, 1, TILE);
    g.fillRect(TILE - 1, 0, 1, TILE);
}

function buildTileSprites() {
    const out = {};
    const wall = makeCanvas(TILE, TILE);
    drawWallTile(wall.getContext('2d'));
    out.wall = wall;

    const floorA = makeCanvas(TILE, TILE);
    drawFloorTileA(floorA.getContext('2d'));
    out.floorA = floorA;

    const floorB = makeCanvas(TILE, TILE);
    drawFloorTileB(floorB.getContext('2d'));
    out.floorB = floorB;

    const doorR = makeCanvas(TILE, TILE);
    drawDoor(doorR.getContext('2d'), false);
    out.doorR = doorR;

    const doorL = makeCanvas(TILE, TILE);
    drawDoor(doorL.getContext('2d'), true);
    out.doorL = doorL;

    const doorOut = makeCanvas(TILE, TILE);
    drawHeavenDoor(doorOut.getContext('2d'));
    out.doorOut = doorOut;

    return out;
}

let cache = null;
export function getSprites() {
    if (!cache) {
        cache = {
            player:  buildPlayerSprites(),
            objects: buildObjectSprites(),
            tiles:   buildTileSprites(),
        };
    }
    return cache;
}
