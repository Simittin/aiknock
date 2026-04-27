// Tuş durumu + tek-atış (one-shot) desteği. Hareket için isDown, etkileşim
// için consumeKey kullanılır — basılı tutmak tetiği bir kez sayar.

const keys = Object.create(null);
const justPressed = new Set();

const TRACKED = new Set([
    'w', 'a', 's', 'd',
    'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
    'e', 'enter', 'escape'
]);

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (!TRACKED.has(k)) return;
    if (!keys[k]) justPressed.add(k);
    keys[k] = true;
    e.preventDefault();
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (TRACKED.has(k)) keys[k] = false;
});

export function isDown(...names) {
    return names.some((n) => keys[n]);
}

export function consumeKey(name) {
    if (justPressed.has(name)) {
        justPressed.delete(name);
        return true;
    }
    return false;
}

export function clearPendingKeys() {
    justPressed.clear();
}

export function getMoveVector() {
    let dx = 0, dy = 0;
    if (isDown('w', 'arrowup'))    dy -= 1;
    if (isDown('s', 'arrowdown'))  dy += 1;
    if (isDown('a', 'arrowleft'))  dx -= 1;
    if (isDown('d', 'arrowright')) dx += 1;
    return { dx, dy };
}
