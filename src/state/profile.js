// Oyuncu profili — şimdilik sadece isim. NPC promptları, hatıra metinleri ve
// kayıt sistemi sonraki fazlarda buradan okuyacak.

const STORAGE_KEY = 'knock.playerName';
const MAX_LEN = 20;

let playerName = '';

export function loadProfile() {
    const v = (localStorage.getItem(STORAGE_KEY) || '').trim();
    playerName = v.slice(0, MAX_LEN);
    return playerName;
}

export function setPlayerName(name) {
    const clean = String(name || '').trim().slice(0, MAX_LEN);
    if (!clean) return false;
    playerName = clean;
    localStorage.setItem(STORAGE_KEY, clean);
    return true;
}

export function getPlayerName() {
    return playerName;
}

export function clearProfile() {
    playerName = '';
    localStorage.removeItem(STORAGE_KEY);
}
