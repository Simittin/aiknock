// Ruhsal yük (Burden) durumu. Sentiment analizinin çıktısı buraya akar,
// hareket hızı buradan beslenir. localStorage ile sayfa yenilemesinde korunur.

const STORAGE_KEY = 'knock.burdenScore';
const BURDEN_FLOOR = 0.15; // hız oranı tabanı — 100/100 yükte bile sürünme

let burden = load();
const listeners = new Set();

function clamp(v) { return Math.max(0, Math.min(100, v)); }

function load() {
    const v = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return Number.isFinite(v) ? clamp(v) : 0;
}

function save() {
    localStorage.setItem(STORAGE_KEY, String(burden));
}

function notify() {
    for (const cb of listeners) cb(burden);
}

export function getBurden() { return burden; }

export function setBurden(v) {
    burden = clamp(v);
    save();
    notify();
}

export function addBurden(delta) {
    setBurden(burden + delta);
}

export function resetBurden() { setBurden(0); }

export function onBurdenChange(cb) {
    listeners.add(cb);
    cb(burden);
    return () => listeners.delete(cb);
}

// Hız çarpanı — loop bunu base hıza uygular.
export function getSpeedMultiplier() {
    return Math.max(BURDEN_FLOOR, 1 - burden / 100);
}
