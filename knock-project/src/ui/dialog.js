// Retro RPG diyalog kutusu — sayfalı metin, Enter ilerletir, Esc kapatır.
// Açıkken motor hareket güncellemesini atlar (freeze). UI tamamen DOM tabanlı,
// canvas üzerine HTML overlay olarak biner.

let pages = [];
let pageIdx = 0;
let onCloseCb = null;

const overlay = () => document.getElementById('dialog-overlay');
const titleEl = () => document.getElementById('dialog-title');
const textEl  = () => document.getElementById('dialog-text');
const hintEl  = () => document.getElementById('dialog-hint');

function renderPage() {
    textEl().textContent = pages[pageIdx];
    const isLast = pageIdx === pages.length - 1;
    hintEl().textContent = isLast
        ? '[ENTER] KAPAT     [ESC] KAPAT'
        : '[ENTER] DEVAM     [ESC] KAPAT';
}

export function openDialog({ title, pages: p, onClose } = {}) {
    pages = Array.isArray(p) ? p.slice() : [String(p || '')];
    pageIdx = 0;
    onCloseCb = onClose || null;
    titleEl().textContent = title || '';
    renderPage();
    overlay().classList.remove('hidden');
}

export function isDialogOpen() {
    return !overlay().classList.contains('hidden');
}

export function advanceDialog() {
    if (pageIdx < pages.length - 1) {
        pageIdx++;
        renderPage();
    } else {
        closeDialog();
    }
}

export function closeDialog() {
    overlay().classList.add('hidden');
    const cb = onCloseCb;
    onCloseCb = null;
    pages = [];
    pageIdx = 0;
    if (cb) cb();
}
