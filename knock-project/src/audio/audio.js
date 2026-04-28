// Procedural ses motoru — Web Audio API. Hiçbir dosya yok, tüm sesler
// osillator + noise + filter ile sentezlenir. AudioContext autoplay
// kısıtlaması: ctx ilk kullanıcı etkileşiminden sonra resume edilmeli;
// main.js, name onay sonrası start() çağırır.

let ctx = null;
let masterGain = null;
let started = false;

const nodes = {
    rain: null,
    drone: null,
};

function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
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

// Yağmur — bandpass filtreli white noise, hafif LFO ile değişken
export function startRain(intensity = 0.4) {
    ensure();
    if (nodes.rain) return;
    const noise = ctx.createBufferSource();
    noise.buffer = getNoise(3);
    noise.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4500;
    bp.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = intensity * 0.18;

    // LFO — yağmurun şiddet dalgalanması
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.25;
    lfoGain.gain.value = 800;
    lfo.connect(lfoGain).connect(bp.frequency);
    lfo.start();

    noise.connect(bp).connect(gain).connect(masterGain);
    noise.start();

    nodes.rain = { noise, lfo, gain, baseIntensity: intensity };
}

export function setRainIntensity(intensity) {
    if (!nodes.rain || !ctx) return;
    nodes.rain.baseIntensity = intensity;
    nodes.rain.gain.gain.linearRampToValueAtTime(
        intensity * 0.18,
        ctx.currentTime + 0.6
    );
}

export function stopRain() {
    if (!nodes.rain) return;
    try { nodes.rain.noise.stop(); } catch { /* ignore */ }
    try { nodes.rain.lfo.stop(); }   catch { /* ignore */ }
    nodes.rain = null;
}

// Oda dronu — düşük frekans, burden arttıkça daha kararsız ve hafif yükselir
export function startDrone() {
    ensure();
    if (nodes.drone) return;
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 55.4; // hafif detune, vızıltı

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.value = 0.045;

    // LFO — odanın "nefesi"
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 40;
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
    // Yük arttıkça: ses biraz yükselir, LFO derinliği artar (kararsızlaşır),
    // filtre düşer (boğuk hisseder)
    nodes.drone.gain.gain.linearRampToValueAtTime(0.045 + ratio * 0.05, t + 1.2);
    nodes.drone.lfoGain.gain.linearRampToValueAtTime(40 + ratio * 80, t + 1.2);
    nodes.drone.lp.frequency.linearRampToValueAtTime(220 - ratio * 90, t + 1.2);
}

export function fadeOutAmbient(seconds = 2) {
    if (!ctx) return;
    const t = ctx.currentTime;
    if (nodes.rain)  nodes.rain.gain.gain.linearRampToValueAtTime(0.0001,  t + seconds);
    if (nodes.drone) nodes.drone.gain.gain.linearRampToValueAtTime(0.0001, t + seconds);
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
    lp.frequency.value = 700 + Math.random() * 300; // her adım hafif farklı
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, t);
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
    gain.gain.setValueAtTime(0.10, t);
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
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    noise.connect(bp).connect(gain).connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.45);
}

// Kalp atışı — burden ani sıçradığında
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
        g.gain.setValueAtTime(0.32, t + offset);
        g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.22);
        o.connect(g).connect(masterGain);
        o.start(t + offset);
        o.stop(t + offset + 0.24);
    };
    thump(0);
    thump(0.18);
}

// Cennetin kapısı — üç tok vuruş, melodik
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
        g.gain.setValueAtTime(0.18, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        // Lowpass yumuşatır
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 600;
        o.connect(lp).connect(g).connect(masterGain);
        o.start(start);
        o.stop(start + 0.22);
    }
}
