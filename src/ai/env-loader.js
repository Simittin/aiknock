// Tarayıcı tarafı .env okuma — anahtar açıkta kalır, yalnızca demo/prototip
// için. Prod'da backend proxy gerekir.
//
// Hem Vite (`import.meta.env.VITE_GEMINI_API_KEY`) hem statik server
// (python -m http.server vb. ile fetch '.env') ortamlarında çalışır.

let cached = null;

function tryViteEnv() {
    try {
        const env = (typeof import.meta !== 'undefined') ? import.meta.env : null;
        if (env && env.VITE_GEMINI_API_KEY) return String(env.VITE_GEMINI_API_KEY).trim();
    } catch { /* import.meta yoksa veya runtime engellerse */ }
    return '';
}

export async function getApiKey() {
    if (cached !== null) return cached;
    // 1) Vite ortamı varsa direkt al
    const vite = tryViteEnv();
    if (vite) {
        cached = vite;
        return cached;
    }
    // 2) Statik server fallback — fetch ile .env oku, GEMINI_API_KEY=... satırı
    try {
        const res = await fetch(`.env?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) {
            cached = '';
            return cached;
        }
        const text = await res.text();
        const m = text.match(/^\s*(?:VITE_)?GEMINI_API_KEY\s*=\s*(.+?)\s*$/m);
        cached = m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
        return cached;
    } catch {
        cached = '';
        return cached;
    }
}

export function clearApiKeyCache() {
    cached = null;
}
