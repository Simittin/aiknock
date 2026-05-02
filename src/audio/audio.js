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
    const sr = ctx.sampleRate;

    // --- Ortak noise buffer (10 saniyelik — uzun gök gürültüsü için) ---
    const noiseDur = 10;
    const buf = ctx.createBuffer(2, sr * noiseDur, sr);
    for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }

    // --- Reverb impulse (uzun kuyruklu, gökyüzü genişliği için) ---
    const reverbLen = 5;
    const reverbBuf = ctx.createBuffer(2, sr * reverbLen, sr);
    for (let ch = 0; ch < 2; ch++) {
        const rd = reverbBuf.getChannelData(ch);
        for (let i = 0; i < rd.length; i++) {
            rd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rd.length, 2.0);
        }
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = reverbBuf;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.30;
    reverb.connect(reverbGain).connect(masterGain);

    // Dry/wet bus
    const dryBus = ctx.createGain();
    dryBus.gain.value = 0.8;
    dryBus.connect(masterGain);
    dryBus.connect(reverb);

    // ============================================================
    // 1) MUFFLED ONSET — yumuşak, boğuk başlangıç (şimşek değil, uzak gürültü)
    // ============================================================
    const onset = ctx.createBufferSource();
    onset.buffer = buf;
    const lpOnset = ctx.createBiquadFilter();
    lpOnset.type = 'lowpass';
    lpOnset.frequency.value = 600;
    lpOnset.Q.value = 0.4;
    const gOnset = ctx.createGain();
    gOnset.gain.setValueAtTime(0.0001, t);
    gOnset.gain.linearRampToValueAtTime(0.25, t + 0.08);
    gOnset.gain.linearRampToValueAtTime(0.15, t + 0.3);
    gOnset.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    onset.connect(lpOnset).connect(gOnset).connect(dryBus);
    onset.start(t);
    onset.stop(t + 1.0);

    // ============================================================
    // 2) ROLLING RUMBLE WAVE 1 — ilk yuvarlanma dalgası
    //    Amplitude LFO ile dalgalanan gürültü
    // ============================================================
    const roll1 = ctx.createBufferSource();
    roll1.buffer = buf;
    roll1.loop = true;
    const lpRoll1 = ctx.createBiquadFilter();
    lpRoll1.type = 'lowpass';
    lpRoll1.frequency.value = 200;
    lpRoll1.Q.value = 0.6;
    // Amplitude modulation — ses yükselip alçalır, yuvarlanma hissi
    const ampLfo1 = ctx.createOscillator();
    ampLfo1.type = 'sine';
    ampLfo1.frequency.value = 0.4 + Math.random() * 0.3;
    const ampLfoGain1 = ctx.createGain();
    ampLfoGain1.gain.value = 0.15;
    const ampOffset1 = ctx.createGain();
    ampOffset1.gain.value = 0.30;
    // LFO → gain modulation
    const roll1Gain = ctx.createGain();
    roll1Gain.gain.setValueAtTime(0.0001, t + 0.1);
    roll1Gain.gain.linearRampToValueAtTime(0.45, t + 0.5);
    roll1Gain.gain.linearRampToValueAtTime(0.35, t + 2.5);
    roll1Gain.gain.linearRampToValueAtTime(0.15, t + 5.0);
    roll1Gain.gain.exponentialRampToValueAtTime(0.001, t + 7.5);
    // Frekans modülasyonu — filtre frekansını sallandır
    const freqLfo1 = ctx.createOscillator();
    freqLfo1.type = 'sine';
    freqLfo1.frequency.value = 0.3;
    const freqLfoGain1 = ctx.createGain();
    freqLfoGain1.gain.value = 60;
    freqLfo1.connect(freqLfoGain1).connect(lpRoll1.frequency);
    freqLfo1.start(t + 0.1);
    ampLfo1.connect(ampLfoGain1).connect(roll1Gain.gain);
    ampLfo1.start(t + 0.1);
    roll1.connect(lpRoll1).connect(roll1Gain).connect(dryBus);
    roll1.start(t + 0.1);
    roll1.stop(t + 7.8);
    ampLfo1.stop(t + 7.8);
    freqLfo1.stop(t + 7.8);

    // ============================================================
    // 3) ROLLING RUMBLE WAVE 2 — ikinci dalga, biraz gecikmeli
    //    Farklı LFO hızı ile interferans yaratır
    // ============================================================
    const roll2 = ctx.createBufferSource();
    roll2.buffer = buf;
    roll2.loop = true;
    const lpRoll2 = ctx.createBiquadFilter();
    lpRoll2.type = 'lowpass';
    lpRoll2.frequency.value = 140;
    lpRoll2.Q.value = 0.5;
    const ampLfo2 = ctx.createOscillator();
    ampLfo2.type = 'sine';
    ampLfo2.frequency.value = 0.25 + Math.random() * 0.2;
    const ampLfoGain2 = ctx.createGain();
    ampLfoGain2.gain.value = 0.12;
    const roll2Gain = ctx.createGain();
    roll2Gain.gain.setValueAtTime(0.0001, t + 0.4);
    roll2Gain.gain.linearRampToValueAtTime(0.35, t + 1.0);
    roll2Gain.gain.linearRampToValueAtTime(0.30, t + 3.0);
    roll2Gain.gain.linearRampToValueAtTime(0.10, t + 6.0);
    roll2Gain.gain.exponentialRampToValueAtTime(0.001, t + 8.5);
    const freqLfo2 = ctx.createOscillator();
    freqLfo2.type = 'sine';
    freqLfo2.frequency.value = 0.18;
    const freqLfoGain2 = ctx.createGain();
    freqLfoGain2.gain.value = 45;
    freqLfo2.connect(freqLfoGain2).connect(lpRoll2.frequency);
    freqLfo2.start(t + 0.4);
    ampLfo2.connect(ampLfoGain2).connect(roll2Gain.gain);
    ampLfo2.start(t + 0.4);
    roll2.connect(lpRoll2).connect(roll2Gain).connect(dryBus);
    roll2.start(t + 0.4);
    roll2.stop(t + 8.8);
    ampLfo2.stop(t + 8.8);
    freqLfo2.stop(t + 8.8);

    // ============================================================
    // 4) ROLLING RUMBLE WAVE 3 — üçüncü dalga, en derin ve en geç
    // ============================================================
    const roll3 = ctx.createBufferSource();
    roll3.buffer = buf;
    roll3.loop = true;
    const lpRoll3 = ctx.createBiquadFilter();
    lpRoll3.type = 'lowpass';
    lpRoll3.frequency.value = 100;
    lpRoll3.Q.value = 0.4;
    const ampLfo3 = ctx.createOscillator();
    ampLfo3.type = 'sine';
    ampLfo3.frequency.value = 0.15 + Math.random() * 0.15;
    const ampLfoGain3 = ctx.createGain();
    ampLfoGain3.gain.value = 0.10;
    const roll3Gain = ctx.createGain();
    roll3Gain.gain.setValueAtTime(0.0001, t + 0.8);
    roll3Gain.gain.linearRampToValueAtTime(0.25, t + 1.8);
    roll3Gain.gain.linearRampToValueAtTime(0.20, t + 4.0);
    roll3Gain.gain.linearRampToValueAtTime(0.08, t + 6.5);
    roll3Gain.gain.exponentialRampToValueAtTime(0.001, t + 9.0);
    ampLfo3.connect(ampLfoGain3).connect(roll3Gain.gain);
    ampLfo3.start(t + 0.8);
    roll3.connect(lpRoll3).connect(roll3Gain).connect(dryBus);
    roll3.start(t + 0.8);
    roll3.stop(t + 9.3);
    ampLfo3.stop(t + 9.3);

    // ============================================================
    // 5) SUB-BASS DRONES — iki osilator, hafif frekans farkıyla beating
    // ============================================================
    const sub1 = ctx.createOscillator();
    sub1.type = 'sine';
    sub1.frequency.setValueAtTime(38, t);
    sub1.frequency.exponentialRampToValueAtTime(22, t + 4.0);
    const sub2 = ctx.createOscillator();
    sub2.type = 'sine';
    sub2.frequency.setValueAtTime(40, t);
    sub2.frequency.exponentialRampToValueAtTime(23, t + 4.0);
    const gSub = ctx.createGain();
    gSub.gain.setValueAtTime(0.0001, t + 0.1);
    gSub.gain.linearRampToValueAtTime(0.22, t + 0.6);
    gSub.gain.linearRampToValueAtTime(0.15, t + 2.5);
    gSub.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
    sub1.connect(gSub);
    sub2.connect(gSub);
    gSub.connect(dryBus);
    sub1.start(t + 0.1);
    sub2.start(t + 0.1);
    sub1.stop(t + 5.2);
    sub2.stop(t + 5.2);

    // ============================================================
    // 6) DISTANT TAIL — en sona kalan uzak, karanlık kuyruk
    // ============================================================
    const tail = ctx.createBufferSource();
    tail.buffer = buf;
    tail.loop = true;
    const lpTail = ctx.createBiquadFilter();
    lpTail.type = 'lowpass';
    lpTail.frequency.value = 180;
    lpTail.Q.value = 0.3;
    const gTail = ctx.createGain();
    const tailDelay = 1.5 + Math.random() * 1.0;
    gTail.gain.setValueAtTime(0.0001, t + tailDelay);
    gTail.gain.linearRampToValueAtTime(0.10, t + tailDelay + 0.8);
    gTail.gain.linearRampToValueAtTime(0.06, t + tailDelay + 3.0);
    gTail.gain.exponentialRampToValueAtTime(0.001, t + tailDelay + 5.0);
    tail.connect(lpTail).connect(gTail).connect(dryBus);
    tail.start(t + tailDelay);
    tail.stop(t + tailDelay + 5.3);
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
        o.frequency.setValueAtTime(75, t + offset);
        o.frequency.exponentialRampToValueAtTime(38, t + offset + 0.18);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.24, t + offset);
        g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.26);
        o.connect(g).connect(masterGain);
        o.start(t + offset);
        o.stop(t + offset + 0.28);
    };
    thump(0);
    thump(0.22);
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

// ─── Ending music entegrasyonu için context/gain erişimi ─────────────
export function getAudioContext() { ensure(); return ctx; }
export function getMasterGain()   { ensure(); return masterGain; }

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
