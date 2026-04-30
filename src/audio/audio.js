// Procedural ses motoru — Web Audio API. Hiçbir dosya yok, tüm sesler
// osillator + noise + filter ile sentezlenir.
//
// Yağmur 2 katmanlı (warm rumble + ince patter). Şimşek 1.5sn sonra
// dramatik açılış + sonra 10-18sn (ilk), 20-45sn (sonrası) rastgele.
// Tüm seviyeler düşük tutuldu — atmosfer arka plandan gelsin.

let ctx = null;
let masterGain = null;
let started = false;

const nodes = {
    rain: null,
    drone: null,
};

let thunderTimer = null;

function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.32;
    masterGain.connect(ctx.destination);
}

export function start() {
    ensure();
    if (ctx.state === 'suspended') ctx.resume();
    started = true;
}

export function isStarted() { return started; }

// --- Beyaz gürültü buffer (yeniden kullanılır) ---
let noiseBuffer = null;
function getNoise(seconds = 2) {
    ensure();
    if (noiseBuffer && noiseBuffer.duration >= seconds) return noiseBuffer;
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * seconds, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffer = buf;
    return buf;
}

// =========================================================================
// AMBIENT — sürekli sesler
// =========================================================================

export function startRain(intensity = 0.4) {
    ensure();
    if (nodes.rain) return;

    // Layer 1 — Warm "outside" rumble
    const noise1 = ctx.createBufferSource();
    noise1.buffer = getNoise(4);
    noise1.loop = true;
    const hp1 = ctx.createBiquadFilter();
    hp1.type = 'highpass';
    hp1.frequency.value = 180;
    const lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = 1400;
    lp1.Q.value = 0.4;
    const gain1 = ctx.createGain();
    gain1.gain.value = intensity * 0.05;
    noise1.connect(hp1).connect(lp1).connect(gain1).connect(masterGain);
    noise1.start();

    // Layer 2 — İnce patter, LFO'lu
    const noise2 = ctx.createBufferSource();
    noise2.buffer = getNoise(4);
    noise2.loop = true;
    const bp2 = ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.frequency.value = 3200;
    bp2.Q.value = 0.55;
    const gain2 = ctx.createGain();
    gain2.gain.value = intensity * 0.04;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 700;
    lfo.connect(lfoGain).connect(bp2.frequency);
    lfo.start();
    noise2.connect(bp2).connect(gain2).connect(masterGain);
    noise2.start();

    nodes.rain = { noise1, noise2, lfo, gain1, gain2, baseIntensity: intensity };

    // Giriş şimşeği — oyun açılınca 1.5sn sonra
    setTimeout(() => { if (nodes.rain && ctx) playThunder(); }, 1500);
    scheduleNextThunder(true);
}

export function setRainIntensity(intensity) {
    if (!nodes.rain || !ctx) return;
    nodes.rain.baseIntensity = intensity;
    const t = ctx.currentTime;
    nodes.rain.gain1.gain.linearRampToValueAtTime(intensity * 0.05, t + 0.6);
    nodes.rain.gain2.gain.linearRampToValueAtTime(intensity * 0.04, t + 0.6);
}

export function stopRain() {
    if (!nodes.rain) return;
    try { nodes.rain.noise1.stop(); } catch { /* ignore */ }
    try { nodes.rain.noise2.stop(); } catch { /* ignore */ }
    try { nodes.rain.lfo.stop(); }   catch { /* ignore */ }
    nodes.rain = null;
    if (thunderTimer) { clearTimeout(thunderTimer); thunderTimer = null; }
}

function scheduleNextThunder(isFirst = false) {
    if (!nodes.rain) return;
    const delay = isFirst
        ? 10000 + Math.random() * 8000
        : 20000 + Math.random() * 25000;
    thunderTimer = setTimeout(() => {
        if (nodes.rain) {
            playThunder();
            scheduleNextThunder(false);
        }
    }, delay);
}

export function playThunder() {
    console.log('[audio] playThunder', { ctxState: ctx?.state, master: !!masterGain });
    if (!ctx || !masterGain) return;
    const t = ctx.currentTime;

    // Dedicated noise buffer (cache paylaşımına bağlı kalmamak için)
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * 5, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    // Crack
    const crack = ctx.createBufferSource();
    crack.buffer = buf;
    const hpC = ctx.createBiquadFilter();
    hpC.type = 'highpass';
    hpC.frequency.value = 800;
    const gC = ctx.createGain();
    gC.gain.setValueAtTime(0.0001, t);
    gC.gain.linearRampToValueAtTime(0.85, t + 0.015);
    gC.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    crack.connect(hpC).connect(gC).connect(masterGain);
    crack.start(t);
    crack.stop(t + 0.45);

    // Rumble
    const rumble = ctx.createBufferSource();
    rumble.buffer = buf;
    rumble.loop = true;
    const lpR = ctx.createBiquadFilter();
    lpR.type = 'lowpass';
    lpR.frequency.value = 180;
    lpR.Q.value = 0.6;
    const gR = ctx.createGain();
    gR.gain.setValueAtTime(0.0001, t + 0.1);
    gR.gain.linearRampToValueAtTime(0.9, t + 0.6);
    gR.gain.linearRampToValueAtTime(0.6, t + 2.2);
    gR.gain.exponentialRampToValueAtTime(0.001, t + 5);
    rumble.connect(lpR).connect(gR).connect(masterGain);
    rumble.start(t);
    rumble.stop(t + 5.3);

    // Sub-bass
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(50, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 1.2);
    const gS = ctx.createGain();
    gS.gain.setValueAtTime(0.0001, t);
    gS.gain.linearRampToValueAtTime(0.5, t + 0.25);
    gS.gain.exponentialRampToValueAtTime(0.001, t + 2);
    sub.connect(gS).connect(masterGain);
    sub.start(t);
    sub.stop(t + 2.2);
}

export function startDrone() {
    ensure();
    if (nodes.drone) return;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 55.4;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.value = 0.025;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();

    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(gain).connect(masterGain);
    osc1.start();
    osc2.start();

    nodes.drone = { osc1, osc2, lfo, lfoGain, lp, gain };
}

export function setDroneBurden(burden) {
    if (!nodes.drone || !ctx) return;
    const b = Math.max(0, Math.min(100, burden));
    const ratio = b / 100;
    const t = ctx.currentTime;
    nodes.drone.gain.gain.linearRampToValueAtTime(0.025 + ratio * 0.03, t + 1.2);
    nodes.drone.lfoGain.gain.linearRampToValueAtTime(30 + ratio * 60, t + 1.2);
    nodes.drone.lp.frequency.linearRampToValueAtTime(220 - ratio * 90, t + 1.2);
}

export function fadeOutAmbient(seconds = 2) {
    if (!ctx) return;
    const t = ctx.currentTime;
    if (nodes.rain) {
        nodes.rain.gain1.gain.linearRampToValueAtTime(0.0001, t + seconds);
        nodes.rain.gain2.gain.linearRampToValueAtTime(0.0001, t + seconds);
    }
    if (nodes.drone) nodes.drone.gain.gain.linearRampToValueAtTime(0.0001, t + seconds);
    if (thunderTimer) { clearTimeout(thunderTimer); thunderTimer = null; }
}

// =========================================================================
// ONE-SHOT efektler
// =========================================================================

export function playFootstep() {
    if (!started) return;
    ensure();
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = getNoise(0.12);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700 + Math.random() * 300;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    noise.connect(lp).connect(gain).connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.1);
}

export function playInteract() {
    if (!started) return;
    ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
}

export function playDoor() {
    if (!started) return;
    ensure();
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = getNoise(0.5);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 5;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.linearRampToValueAtTime(2200, t + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.10, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    noise.connect(bp).connect(gain).connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.45);
}

export function playBurdenSpike() {
    if (!started) return;
    ensure();
    const t = ctx.currentTime;
    const thump = (offset) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(70, t + offset);
        o.frequency.exponentialRampToValueAtTime(40, t + offset + 0.16);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.20, t + offset);
        g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.22);
        o.connect(g).connect(masterGain);
        o.start(t + offset);
        o.stop(t + offset + 0.24);
    };
    thump(0);
    thump(0.18);
}

export function playKnockTheme() {
    if (!started) return;
    ensure();
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
        const start = t + i * 0.42;
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.setValueAtTime(180, start);
        o.frequency.exponentialRampToValueAtTime(70, start + 0.14);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.13, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 600;
        o.connect(lp).connect(g).connect(masterGain);
        o.start(start);
        o.stop(start + 0.22);
    }
}

// Console diagnostic — F12'den `testThunder()` ile çalıştırılabilir
if (typeof window !== 'undefined') {
    window.testThunder = () => {
        if (!ctx) {
            console.warn('AudioContext yok — önce oyunu başlat');
            return;
        }
        if (ctx.state !== 'running') {
            ctx.resume();
            console.log('Context resume edildi, durum:', ctx.state);
        }
        playThunder();
    };
}
