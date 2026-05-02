// İsim girişi — motor başlamadan önce çağrılır. Promise döner: kullanıcı geçerli
// bir isim girdiğinde resolve. Ekran zaten kayıtlı ismi gösterir, kullanıcı
// değiştirebilir veya onaylayabilir.

import { loadProfile, setPlayerName } from '../state/profile.js';

export function askPlayerName() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('name-overlay');
        const input   = document.getElementById('name-input');
        const btn     = document.getElementById('name-submit');
        const error   = document.getElementById('name-error');

        const existing = loadProfile();
        if (existing) input.value = existing;

        overlay.classList.remove('hidden');
        // Modal görünür olunca odağı al
        setTimeout(() => input.focus(), 0);

        function showError(msg) {
            error.textContent = msg;
            error.classList.add('visible');
            input.style.borderBottom = '1px solid var(--warn)';
        }
        function clearError() {
            error.classList.remove('visible');
            input.style.borderBottom = '';
        }

        function submit() {
            const ok = setPlayerName(input.value);
            if (!ok) {
                showError('* GEÇERLİ BİR İSİM GİR, ASKER.');
                input.focus();
                return;
            }
            overlay.classList.add('hidden');
            btn.removeEventListener('click', submit);
            input.removeEventListener('keydown', onKey);
            resolve(input.value.trim());
        }

        function onKey(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submit();
            } else {
                clearError();
            }
        }

        btn.addEventListener('click', submit);
        input.addEventListener('keydown', onKey);
    });
}
