// Tarayıcı tarafı .env okuma — anahtar açıkta kalır, yalnızca demo/prototip
// için. Prod'da backend proxy gerekir.

let cached = null;

export async function getApiKey() {
    if (cached !== null) return cached;
    try {
        const res = await fetch('.env');
        if (!res.ok) {
            cached = '';
            return cached;
        }
        const text = await res.text();
        const match = text.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/m);
        cached = match ? match[1].replace(/^["']|["']$/g, '').trim() : '';
        return cached;
    } catch {
        cached = '';
        return cached;
    }
}

export function clearApiKeyCache() {
    cached = null;
}
