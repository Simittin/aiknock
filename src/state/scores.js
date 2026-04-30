// Yansıma puanları + tamamlama durumu. Her nesne için tutar:
//   { scores: [number...], labels: [string...], completed: bool, total: number }
// Phase 4 finali bu state'i okuyacak.

const STORAGE_KEY = 'knock.scores';

function blank() { return { objects: {}, totalScore: 0 }; }

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        }
    } catch { /* ignore */ }
    return blank();
}

let state = load();
const listeners = new Set();

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notify() {
    for (const cb of listeners) cb(state);
}

function ensureSlot(id) {
    if (!state.objects[id]) {
        state.objects[id] = { scores: [], labels: [], completed: false, total: 0 };
    }
    return state.objects[id];
}

export function recordTurn(objectId, score, label) {
    const s = ensureSlot(objectId);
    if (typeof score === 'number') {
        s.scores.push(score);
        s.total = (s.total || 0) + score;
        state.totalScore = (state.totalScore || 0) + score;
    }
    if (label) s.labels.push(label);
    save();
    notify();
}

export function markCompleted(objectId) {
    const s = ensureSlot(objectId);
    if (s.completed) return;
    s.completed = true;
    save();
    notify();
}

export function isCompleted(objectId) {
    return !!state.objects[objectId]?.completed;
}

export function getObjectScore(objectId) {
    return state.objects[objectId]?.total || 0;
}

export function getCompletedCount() {
    return Object.values(state.objects).filter((o) => o.completed).length;
}

export function getTotalScore() {
    return state.totalScore || 0;
}

export function onScoresChange(cb) {
    listeners.add(cb);
    cb(state);
    return () => listeners.delete(cb);
}

export function resetScores() {
    state = blank();
    save();
    notify();
}
