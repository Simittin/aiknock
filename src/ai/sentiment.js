// Transformers.js sentiment pipeline — çok dilli (Türkçe destekli) nlptown
// modeli, 1-5 yıldız döndürür. İlk çağrıda model indirilir ve tarayıcı
// cache'ine alınır; sonraki çağrılar anında.

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';
import { addBurden } from '../state/burden.js';

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL = 'Xenova/bert-base-multilingual-uncased-sentiment';

let analyzer = null;
let loadingPromise = null;
let loaded = false;

const listeners = new Set();
function emit(state) { for (const cb of listeners) cb(state); }

export function onSentimentState(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

export function isSentimentReady() { return loaded; }

export async function ensureSentimentLoaded() {
    if (loaded) return analyzer;
    if (!loadingPromise) {
        emit({ status: 'loading' });
        
        loadingPromise = pipeline('sentiment-analysis', MODEL, {
            progress_callback: (data) => {
                if (data.status === 'progress') {
                    // data.progress 0-100 arasıdır
                    emit({ status: 'progress', progress: data.progress });
                }
            }
        })
            .then((p) => {
                analyzer = p;
                loaded = true;
                emit({ status: 'ready' });
                return p;
            })
            .catch((err) => {
                emit({ status: 'error', error: err.message });
                loadingPromise = null;
                throw err;
            });
    }
    return loadingPromise;
}

// 1-5 yıldız sonucunu Burden delta'sına çevirir ve uygular.
// ASİMETRİK SKALA: Olumsuz cevaplar çok daha ağır ceza verir,
// olumlu cevaplar sadece hafif rahatlama sağlar.
// 1⭐ → +28, 2⭐ → +18, 3⭐ → +3, 4⭐ → -5, 5⭐ → -8
export async function analyzeAndApply(text) {
    const m = await ensureSentimentLoaded();
    const [result] = await m(text);
    const stars = parseInt((result.label || '3').match(/\d/)?.[0] || '3', 10);
    const conf = result.score || 0.5;

    // Asimetrik burden haritası — olumsuz cevaplar ağır, olumlu cevaplar hafif
    const BURDEN_MAP = {
        1: +28,   // Çok olumsuz — ağır vicdan yükü
        2: +18,   // Olumsuz — belirgin yük
        3: +3,    // Nötr — hafif tedirginlik (savaş ortamı)
        4: -5,    // Olumlu — küçük rahatlama
        5: -8,    // Çok olumlu — biraz huzur
    };

    const baseDelta = BURDEN_MAP[stars] ?? 0;
    const delta = Math.round(baseDelta * conf);
    addBurden(delta);
    return { stars, score: result.score, delta };
}
