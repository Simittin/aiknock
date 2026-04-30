// Statik lore diyaloğu — AI çağırmaz, burden değiştirmez.
// Oyuncu 'E' ile açar, Enter veya Escape ile kapatır.
// Mevcut dialog-overlay DOM yapısını yeniden kullanır ama input alanını gizler.

import { objects as OBJECT_DB } from '../objects/index.js';
import { clearPendingKeys } from '../engine/input.js';

let loreOpen = false;

const $ = (id) => document.getElementById(id);

function onLoreKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        closeLore();
    }
}

export function isLoreOpen() {
    return loreOpen;
}

export function openLore(objectId) {
    if (loreOpen) return;
    const def = OBJECT_DB[objectId];
    if (!def || !def.lore) return;

    loreOpen = true;

    $('dialog-title').textContent = def.name.toUpperCase();
    const log = $('dialog-text');
    log.innerHTML = '';

    const p = document.createElement('p');
    p.className = 'dlg-line dlg-system';
    p.textContent = def.loreText;
    log.appendChild(p);

    // Input alanını gizle — sadece statik metin
    $('dialog-input-area').style.display = 'none';
    $('dialog-input').disabled = true;

    $('dialog-hint').textContent = '[ENTER] veya [ESC] KAPAT';
    $('dialog-overlay').classList.remove('hidden');

    window.addEventListener('keydown', onLoreKey);
}

export function closeLore() {
    if (!loreOpen) return;
    loreOpen = false;
    $('dialog-overlay').classList.add('hidden');
    // Input alanını eski haline getir (AI diyaloğu için)
    $('dialog-input-area').style.display = '';
    $('dialog-input').disabled = false;
    window.removeEventListener('keydown', onLoreKey);
    clearPendingKeys();
}
