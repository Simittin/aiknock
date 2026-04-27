// env_loader.js
// Yerel geliştirme için .env dosyasını fetch edip basitçe parse eder.
// UYARI: .env tarayıcıdan okunabilir; deploy ortamında güvenlik sağlamaz.

let cache = null;

export async function loadEnv() {
    if (cache) return cache;
    try {
        const res = await fetch('.env', { cache: 'no-store' });
        if (!res.ok) { cache = {}; return cache; }
        const text = await res.text();
        cache = parseEnv(text);
        return cache;
    } catch (_) {
        cache = {};
        return cache;
    }
}

function parseEnv(text) {
    const out = {};
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();
        // Çevreleyen tırnakları soy.
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        out[key] = val;
    }
    return out;
}
