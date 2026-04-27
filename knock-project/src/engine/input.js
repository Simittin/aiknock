// Tuş durumlarını basit bir map'te tutar. WASD ve ok tuşları aynı şeyi yapar.

const keys = Object.create(null);

const TRACKED = new Set([
    'w', 'a', 's', 'd',
    'arrowup', 'arrowdown', 'arrowleft', 'arrowright'
]);

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (TRACKED.has(k)) {
        keys[k] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (TRACKED.has(k)) keys[k] = false;
});

export function isDown(...names) {
    return names.some((n) => keys[n]);
}

export function getMoveVector() {
    let dx = 0, dy = 0;
    if (isDown('w', 'arrowup'))    dy -= 1;
    if (isDown('s', 'arrowdown'))  dy += 1;
    if (isDown('a', 'arrowleft'))  dx -= 1;
    if (isDown('d', 'arrowright')) dx += 1;
    return { dx, dy };
}
