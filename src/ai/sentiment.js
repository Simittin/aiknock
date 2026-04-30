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
        emit('loading');
        loadingPromise = pipeline('sentiment-analysis', MODEL)
            .then((p) => {
                analyzer = p;
                loaded = true;
                emit('ready');
                return p;
            })
            .catch((err) => {
                emit('error');
                loadingPromise = null;
                throw err;
            });
    }
    return loadingPromise;
}

// 1-5 yıldız sonucunu Burden delta'sına çevirir ve uygular.
// 1 yıldız (çok negatif) -> +16, 5 yıldız (çok pozitif) -> -16, güvene göre ölçek.
export async function analyzeAndApply(text) {
    const m = await ensureSentimentLoaded();
    const [result] = await m(text);
    const stars = parseInt((result.label || '3').match(/\d/)?.[0] || '3', 10);
    const sign = 3 - stars;            // +2 .. -2
    const delta = Math.round(sign * 8 * (result.score || 0.5));
    addBurden(delta);
    return { stars, score: result.score, delta };
}
