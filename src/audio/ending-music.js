// Dinamik Bitiş Müziği Üretimi — Final Credits ekranı için.
//
// Burden skoru eşiğine göre farklı duygusal tonlarda ~55sn'lik
// AI müzik parçası üretir. Önceden (pre-fetch) tetiklenir:
//   - Oyuncu son nesne etkileşimini tamamladığında (7/8 → 8/8 geçişi)
//     otomatik olarak generateEndingMusic(currentBurdenScore) çağrılır.
//   - Sonuç window.endingMusicObj global'inde saklanır.
//   - Credits ekranı açıldığında playEndingMusic() ile çalınır.
//
// API Desteği:
//   1. Replicate MusicGen API (REPLICATE_API_TOKEN varsa)
//   2. Fallback: Web Audio API ile prosedürel akustik folk sentezi
//
// Prompt Mühendisliği:
//   - Temel stil: 1973 vintage akustik folk, Bob Dylan tarzı
//   - burden < 50: Melankolik ama huzurlu, rahatlatıcı
//   - burden >= 50: Ağır, depresif, gerilimli

// ─── Prompt Üretici ──────────────────────────────────────────────────
export function getMusicPrompt(score) {
    const baseStyle = "1973 vintage acoustic folk song, Bob Dylan style, lo-fi recording, acoustic guitar and harmonica. ";
    if (score < 50) {
        return baseStyle + "Slow tempo, melancholic but peaceful, a sense of relief, letting go, soft and comforting.";
    } else {
        return baseStyle + "Dragging tempo, dark, depressive, dissonant chords, feeling of heavy burden, regret, and tension.";
    }
}

// ─── Durum ────────────────────────────────────────────────────────────
let generationState = 'idle';   // 'idle' | 'generating' | 'ready' | 'error'
let audioElement = null;
let fallbackNodes = null;       // Web Audio fallback düğümleri
let cachedThreshold = null;     // Son üretimde kullanılan eşik ('light' | 'heavy')

// Global erişim — finale.js okuyacak
window.endingMusicObj = null;

// ─── API ile Üretim — Replicate MusicGen ────────────────────────────
// Token .env'den okunur. Yoksa veya başarısızsa null döner ve
// üst katman prosedürel Web Audio sentezine geçer.
async function tryApiGeneration(prompt) {
    const token = await getEnvVar('REPLICATE_API_TOKEN');
    if (!token) {
        console.log('[ending-music] Replicate token yok, prosedürel sentezle devam.');
        return null;
    }

    const body = {
        version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        input: {
            prompt,
            model_version: "melody",
            duration: 55,
            output_format: "mp3",
            normalization_strategy: "loudness",
        },
    };

    try {
        console.log('[ending-music] Replicate API çağrılıyor…');
        const createRes = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!createRes.ok) {
            console.warn('[ending-music] Replicate API hata:', createRes.status);
            return null;
        }

        const prediction = await createRes.json();
        let result = prediction;

        const maxAttempts = 60;
        for (let i = 0; i < maxAttempts; i++) {
            if (result.status === 'succeeded') break;
            if (result.status === 'failed' || result.status === 'canceled') {
                console.warn('[ending-music] Replicate üretim başarısız:', result.error);
                return null;
            }
            await sleep(2000);
            const pollRes = await fetch(result.urls.get, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!pollRes.ok) return null;
            result = await pollRes.json();
        }

        if (result.status !== 'succeeded' || !result.output) return null;
        const audioUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        console.log('[ending-music] Replicate müzik hazır:', audioUrl);
        return audioUrl;
    } catch (err) {
        console.warn('[ending-music] Replicate hatası:', err.message);
        return null;
    }
}

// ─── Genel .env okuyucu ──────────────────────────────────────────────
// Hem Vite (`import.meta.env.VITE_<NAME>`) hem statik server (.env fetch) destekler.
async function getEnvVar(name) {
    try {
        const env = (typeof import.meta !== 'undefined') ? import.meta.env : null;
        const viteName = `VITE_${name}`;
        if (env && env[viteName]) return String(env[viteName]).trim();
    } catch { /* pass */ }
    try {
        const res = await fetch(`.env?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const text = await res.text();
        const re = new RegExp(`^\\s*(?:VITE_)?${name}\\s*=\\s*(.+?)\\s*$`, 'm');
        const m = text.match(re);
        return m ? m[1].replace(/^["']|["']$/g, '').trim() : null;
    } catch {
        return null;
    }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Web Audio Prosedürel Fallback ──────────────────────────────────
// Replicate API yoksa veya başarısız olursa, Web Audio API ile
// Bob Dylan tarzı akustik folk teması sentezlenir.

function createProceduralEnding(ctx, masterGain, isHeavy) {
    const t = ctx.currentTime;
    const duration = 55;
    const nodes = [];

    // --- Akustik Gitar Simülasyonu (Karplus-Strong benzeri) ---
    // Bob Dylan, "Knockin' on Heaven's Door" (1973), G majör.
    // Asıl akor progresyonu: G - D - Am7 - G - D - C  (verse + chorus aynı)
    //
    // Light (huzurlu): orijinal majör progresyon, normal tempo
    // Heavy (ağır): Am köküne kayan, sürünen tempo, minör his

    // Frekanslar — root nota (A=440 standardı)
    // G3=196, A3=220, B3=246.94, C4=261.63, D4=293.66, E4=329.63
    const lightChords = [
        { name: 'G',   freq: 196.00, dur: 3.0 },
        { name: 'D',   freq: 293.66, dur: 3.0 },
        { name: 'Am7', freq: 220.00, dur: 3.0 },
        { name: 'G',   freq: 196.00, dur: 3.0 },
        { name: 'D',   freq: 293.66, dur: 3.0 },
        { name: 'C',   freq: 261.63, dur: 3.0 },
    ];
    // Heavy: Am7 ekseninde daha karanlık, tempoyu sürükleyen versiyon
    const heavyChords = [
        { name: 'Am7', freq: 220.00, dur: 4.5 },
        { name: 'Em',  freq: 164.81, dur: 4.5 },
        { name: 'D',   freq: 146.83, dur: 4.5 }, // alt oktav D — daha çukur
        { name: 'Am7', freq: 220.00, dur: 4.5 },
    ];
    const chords = isHeavy ? heavyChords : lightChords;
    const tempo = isHeavy ? 0.55 : 0.85; // heavy belirgin yavaş

    // Reverb impulse — daha geniş ve belirgin
    const reverbLen = 4;
    const reverbBuf = ctx.createBuffer(2, ctx.sampleRate * reverbLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const rd = reverbBuf.getChannelData(ch);
        for (let i = 0; i < rd.length; i++) {
            rd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rd.length, 2.0);
        }
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = reverbBuf;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = isHeavy ? 0.8 : 0.6;
    reverb.connect(reverbGain).connect(masterGain);
    nodes.push(reverb, reverbGain);

    // Dry bus — yüksek kazanç
    const dryBus = ctx.createGain();
    dryBus.gain.value = 1.4;
    dryBus.connect(masterGain);
    dryBus.connect(reverb);
    nodes.push(dryBus);

    // Fade in/out envelope — çok daha güçlü
    const mainEnv = ctx.createGain();
    mainEnv.gain.setValueAtTime(0.0001, t);
    mainEnv.gain.linearRampToValueAtTime(isHeavy ? 0.55 : 0.65, t + 3.0);
    mainEnv.gain.setValueAtTime(isHeavy ? 0.55 : 0.65, t + duration - 6);
    mainEnv.gain.linearRampToValueAtTime(0.0001, t + duration);
    mainEnv.connect(dryBus);
    nodes.push(mainEnv);

    // Akor döngüsü — 4 tekrar boyunca çal (~50-55sn)
    let offset = 0;
    for (let rep = 0; rep < 4 && offset < duration - 1; rep++) {
        for (const chord of chords) {
            if (offset >= duration - 1) break;
            const chordStart = t + offset;
            const chordDur = chord.dur / tempo;

            // Strum pattern — 4 veya 6 vuruş
            const strums = isHeavy ? 4 : 6;
            for (let s = 0; s < strums && (offset + s * (chordDur / strums)) < duration; s++) {
                const strumTime = chordStart + s * (chordDur / strums);
                const strumDur = chordDur / strums * 0.8;

                // Temel nota + oktav + quint
                const freqs = [
                    chord.freq,
                    chord.freq * 2,
                    chord.freq * 1.5,
                ];

                for (const f of freqs) {
                    const osc = ctx.createOscillator();
                    // Akustik gitar benzeri — triangle + hafif detune
                    osc.type = isHeavy ? 'sawtooth' : 'triangle';
                    osc.frequency.value = f + (Math.random() - 0.5) * 2;

                    const lp = ctx.createBiquadFilter();
                    lp.type = 'lowpass';
                    // Heavy: daha karanlık ton
                    lp.frequency.value = isHeavy ? 800 + Math.random() * 200 : 1200 + Math.random() * 400;
                    lp.Q.value = isHeavy ? 2.0 : 1.2;

                    const g = ctx.createGain();
                    const vol = (isHeavy ? 0.18 : 0.24) * (1 - s * 0.04);
                    g.gain.setValueAtTime(vol, strumTime);
                    g.gain.exponentialRampToValueAtTime(0.001, strumTime + strumDur);

                    osc.connect(lp).connect(g).connect(mainEnv);
                    osc.start(strumTime);
                    osc.stop(strumTime + strumDur + 0.05);
                    nodes.push(osc, lp, g);
                }
            }
            offset += chordDur;
        }
    }

    // --- Harmonika / Melodica simülasyonu ---
    // Knockin' on Heaven's Door'un ikonik vokal hattı:
    //   "Mama take this badge off of me"   → D-D-D-D-C-B-A-G  (G major'da inişli)
    //   "I can't use it anymore"           → D-C-B-A-G
    //   "I feel I'm knockin' on heaven's door" → G-A-B-C-D-D-C-B-A-G  (yükselip iniyor)
    //
    // Frekanslar (oktav 4-5):
    //   G4=392, A4=440, B4=493.88, C5=523.25, D5=587.33
    //   Heavy modda alt oktav + minör tonlar: A3=220, B3=246.94, C4=261.63, D4=293.66, E4=329.63

    // LIGHT (G major, descending melancholic-but-peaceful)
    const lightPhrase1 = [587, 587, 523, 494, 440, 392, 392, 440]; // "mama take this badge off of me"
    const lightPhrase2 = [440, 494, 523, 587, 523, 494, 440, 392]; // "i can't use it anymore"
    const lightPhrase3 = [392, 440, 494, 523, 587, 587, 523, 494]; // "i feel i'm knockin' on..."
    const lightPhrase4 = [440, 392, 392, 0,   587, 523, 494, 440]; // "...heaven's door" (0=rest)

    // HEAVY (Am tonal merkezi, minör his — alt oktav, daha karanlık)
    const heavyPhrase1 = [440, 440, 392, 349, 330, 294, 294, 330]; // descending in Am
    const heavyPhrase2 = [330, 349, 392, 440, 392, 349, 330, 294]; // arch then fall
    const heavyPhrase3 = [220, 247, 261, 294, 330, 294, 261, 247]; // alt oktava iniş
    const heavyPhrase4 = [294, 261, 247, 220, 220, 247, 261, 294]; // bottom roll

    const fullMelody = isHeavy
        ? [...heavyPhrase1, ...heavyPhrase2, ...heavyPhrase3, ...heavyPhrase4]
        : [...lightPhrase1, ...lightPhrase2, ...lightPhrase3, ...lightPhrase4];
    const noteLen = isHeavy ? 1.7 : 1.35;
    const melodyStart = t + 4; // 4sn sonra gir
    const melodyGain = ctx.createGain();
    melodyGain.gain.value = isHeavy ? 0.16 : 0.20;
    melodyGain.connect(mainEnv);
    nodes.push(melodyGain);

    for (let i = 0; i < fullMelody.length; i++) {
        const noteTime = melodyStart + i * noteLen;
        if (noteTime >= t + duration - 3) break;

        const freq = fullMelody[i];
        // Sıfır = sus (rest) — orijinal şarkıdaki es noktaları
        if (freq === 0) continue;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Vibrato — harmonika hissi
        const vib = ctx.createOscillator();
        vib.frequency.value = isHeavy ? 3.5 : 5.0;
        const vibGain = ctx.createGain();
        vibGain.gain.value = isHeavy ? 5 : 7;
        vib.connect(vibGain).connect(osc.frequency);
        vib.start(noteTime);
        vib.stop(noteTime + noteLen);

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = freq * 2;
        bp.Q.value = 2.5;

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, noteTime);
        env.gain.linearRampToValueAtTime(1.0, noteTime + 0.12);
        env.gain.setValueAtTime(0.9, noteTime + noteLen * 0.7);
        env.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLen);

        osc.connect(bp).connect(env).connect(melodyGain);
        osc.start(noteTime);
        osc.stop(noteTime + noteLen + 0.1);
        nodes.push(osc, vib, vibGain, bp, env);
    }

    // --- Bas Drone (atmosfer) — güçlendirilmiş ---
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = isHeavy ? 55 : 65;
    const bass2 = ctx.createOscillator();
    bass2.type = 'sine';
    bass2.frequency.value = isHeavy ? 55.5 : 65.3; // hafif beating
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.0001, t);
    bassGain.gain.linearRampToValueAtTime(isHeavy ? 0.25 : 0.15, t + 4);
    bassGain.gain.setValueAtTime(isHeavy ? 0.25 : 0.15, t + duration - 7);
    bassGain.gain.linearRampToValueAtTime(0.0001, t + duration);
    bass.connect(bassGain);
    bass2.connect(bassGain);
    bassGain.connect(dryBus);
    bass.start(t);
    bass2.start(t);
    bass.stop(t + duration + 0.5);
    bass2.stop(t + duration + 0.5);
    nodes.push(bass, bass2, bassGain);

    // --- Lo-fi vinil cızırtısı — belirgin ---
    const sr = ctx.sampleRate;
    const crklBuf = ctx.createBuffer(1, sr * duration, sr);
    const crklData = crklBuf.getChannelData(0);
    for (let i = 0; i < crklData.length; i++) {
        // Aralıklı cızırtı — daha sık ve daha yüksek
        crklData[i] = Math.random() < 0.005 ? (Math.random() - 0.5) * 0.5 : 0;
    }
    const crklSrc = ctx.createBufferSource();
    crklSrc.buffer = crklBuf;
    const crklLP = ctx.createBiquadFilter();
    crklLP.type = 'highpass';
    crklLP.frequency.value = 1800;
    const crklGain = ctx.createGain();
    crklGain.gain.value = 0.10;
    crklSrc.connect(crklLP).connect(crklGain).connect(masterGain);
    crklSrc.start(t);
    crklSrc.stop(t + duration + 0.5);
    nodes.push(crklSrc, crklLP, crklGain);

    // Heavy: dissonant pad eklentisi — güçlendirilmiş
    if (isHeavy) {
        const pad1 = ctx.createOscillator();
        pad1.type = 'sawtooth';
        pad1.frequency.value = 110;
        const pad2 = ctx.createOscillator();
        pad2.type = 'sawtooth';
        pad2.frequency.value = 113; // beating etkisi
        const pad3 = ctx.createOscillator();
        pad3.type = 'sawtooth';
        pad3.frequency.value = 82.5; // alt oktav
        const padLP = ctx.createBiquadFilter();
        padLP.type = 'lowpass';
        padLP.frequency.value = 350;
        padLP.Q.value = 2;
        const padGain = ctx.createGain();
        padGain.gain.setValueAtTime(0.0001, t + 2);
        padGain.gain.linearRampToValueAtTime(0.12, t + 8);
        padGain.gain.setValueAtTime(0.12, t + duration - 8);
        padGain.gain.linearRampToValueAtTime(0.0001, t + duration);
        pad1.connect(padLP);
        pad2.connect(padLP);
        pad3.connect(padLP);
        padLP.connect(padGain).connect(dryBus);
        pad1.start(t + 2);
        pad2.start(t + 2);
        pad3.start(t + 2);
        pad1.stop(t + duration + 0.5);
        pad2.stop(t + duration + 0.5);
        pad3.stop(t + duration + 0.5);
        nodes.push(pad1, pad2, pad3, padLP, padGain);
    }

    return { nodes, duration };
}

// ─── Ana Üretim Fonksiyonu ───────────────────────────────────────────
export async function generateEndingMusic(currentBurdenScore) {
    const isHeavy = currentBurdenScore >= 50;
    const newThreshold = isHeavy ? 'heavy' : 'light';

    // Eşik değişmediyse ve zaten hazırsa tekrar üretme
    if (generationState === 'ready' && cachedThreshold === newThreshold) {
        console.log(`[ending-music] Aynı eşik (${newThreshold}), cache geçerli.`);
        return;
    }

    // Farklı eşik veya ilk üretim — önceki state'i sıfırla
    if (generationState !== 'idle') {
        console.log(`[ending-music] Eşik değişti (${cachedThreshold} → ${newThreshold}), yeniden üretiliyor…`);
        resetEndingMusic();
    }

    generationState = 'generating';
    cachedThreshold = newThreshold;
    const prompt = getMusicPrompt(currentBurdenScore);

    console.log(`[ending-music] Üretim başladı — burden: ${currentBurdenScore}, mod: ${newThreshold.toUpperCase()}`);
    console.log(`[ending-music] Prompt: "${prompt}"`);

    // 1. Önce AI API'yi dene
    try {
        const apiUrl = await tryApiGeneration(prompt);
        if (apiUrl) {
            audioElement = new Audio(apiUrl);
            audioElement.loop = false;
            audioElement.volume = 1.0;
            // Preload
            await new Promise((resolve, reject) => {
                audioElement.addEventListener('canplaythrough', resolve, { once: true });
                audioElement.addEventListener('error', reject, { once: true });
                audioElement.load();
            });
            window.endingMusicObj = { type: 'api', element: audioElement, isHeavy };
            generationState = 'ready';
            console.log('[ending-music] AI müzik yüklendi ve hazır.');
            return;
        }
    } catch (err) {
        console.warn('[ending-music] AI API başarısız, fallback\'e geçiliyor:', err.message);
    }

    // 2. Fallback — prosedürel Web Audio sentez
    // NOT: Prosedürel modda isHeavy playback anında GÜNCEL burden'dan okunur,
    // buradaki değer sadece bilgilendirme amaçlı.
    console.log(`[ending-music] Prosedürel fallback aktif (${newThreshold}).`);
    window.endingMusicObj = { type: 'procedural', isHeavy };
    generationState = 'ready';
}

// ─── Credits Ekranında Müziği Çal ────────────────────────────────────
export function playEndingMusic(ctx, masterGain, liveBurden) {
    const obj = window.endingMusicObj;

    // liveBurden parametresi varsa onu kullan, yoksa cache'e düş
    const resolvedHeavy = (typeof liveBurden === 'number')
        ? liveBurden >= 50
        : (obj?.isHeavy ?? ((window._lastBurdenForMusic || 0) >= 50));

    console.log(`[ending-music] playEndingMusic çağrıldı — isHeavy: ${resolvedHeavy}, obj: ${obj?.type || 'YOK'}`);

    if (!obj) {
        console.warn('[ending-music] Müzik objesi yok — prosedürel fallback çalınıyor.');
        if (ctx && masterGain) {
            fallbackNodes = createProceduralEnding(ctx, masterGain, resolvedHeavy);
        }
        return;
    }

    if (obj.type === 'api' && obj.element) {
        obj.element.currentTime = 0;
        obj.element.play().catch((e) => console.warn('[ending-music] Playback hata:', e));
    } else if (obj.type === 'procedural') {
        // Prosedürel modda her zaman GÜNCEL burden'ı kullan — cache sorununu önler
        if (ctx && masterGain) {
            fallbackNodes = createProceduralEnding(ctx, masterGain, resolvedHeavy);
        }
    }
}

// ─── Durumu sorgula ──────────────────────────────────────────────────
export function isEndingMusicReady() {
    return generationState === 'ready';
}

export function getGenerationState() {
    return generationState;
}

// ─── Dışarıdan sıfırla (yeni oyun için) ─────────────────────────────
export function resetEndingMusic() {
    generationState = 'idle';
    cachedThreshold = null;
    if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        audioElement = null;
    }
    fallbackNodes = null;
    window.endingMusicObj = null;
}
