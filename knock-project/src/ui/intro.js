// Intro ekranı — isim girişinden sonra, motor başlamadan önce çalışır.
// Typewriter ile hikâye metnini sunar, sonra kontroller + burden demo görünür.
// SPACE: yazım sürerken hepsini doldur, tamamlanmışsa oyuna başla.

const NARRATIVE = `Yıl 1973. Dışarıda, camları döven o uzun, kara fırtına dinmek bilmiyor...

Postacının sabah getirdiği o sarı zarf, yatak odasındaki masanın üzerinde duruyor. Vietnam. Dünyanın öbür ucundaki o meçhul karanlık, seni çağırıyor.

Gitme vakti geldi. Ancak bu evden çıkıp o dış kapıya, o 'Cennetin Kapısı'na doğru yürümeden önce yüzleşmen gereken şeyler var. Duvarda asılı duran babanın eski av tüfeği... Yakana iliştirilen o ağır kahramanlık rozeti... Ve mutfakta, fırtınanın dinmesini bekleyen annen.

Benden kahraman olmamı bekliyorlar. Ama bu rozet artık çok ağır. Bu silahları toprağa gömme vakti geldi.

Gitmeden önce son bir kez evde dolaş. Annene veda et. Ancak unutma; ruhunda taşıdığın her öfke, her isyan adımlarını birer demir yığını gibi ağırlaştıracak. Eğer tutunduğun bu yükleri geride bırakamazsan, o kapıya asla ulaşamayacaksın.

Kelimelerini dikkatli seç. Yüklerini bırak. Ve kapıyı çal.`;

const TYPE_SPEED_MS = 22;

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderText(textSoFar) {
    return escapeHtml(textSoFar).replace(/\n/g, '<br>');
}

export function showIntro(playerName) {
    return new Promise((resolve) => {
        const overlay  = document.getElementById('intro-overlay');
        const subtitle = document.getElementById('intro-subtitle');
        const body     = document.getElementById('intro-body');
        const after    = document.getElementById('intro-after');
        const hint     = document.getElementById('intro-hint');

        subtitle.textContent = `ASKER: ${(playerName || '—').toUpperCase()}`;
        body.innerHTML = '';
        after.classList.remove('visible');
        hint.textContent = '[SPACE] HEPSİNİ GÖSTER';
        overlay.classList.remove('hidden');

        let i = 0;
        let typing = true;
        let timer = null;

        function tick() {
            i++;
            body.innerHTML = renderText(NARRATIVE.slice(0, i));
            // Otomatik kaydır
            body.scrollTop = body.scrollHeight;
            if (i >= NARRATIVE.length) {
                finishTyping();
                return;
            }
            timer = setTimeout(tick, TYPE_SPEED_MS);
        }

        function finishTyping() {
            if (timer) { clearTimeout(timer); timer = null; }
            typing = false;
            body.innerHTML = renderText(NARRATIVE);
            after.classList.add('visible');
            hint.textContent = '[SPACE] BAŞLA';
        }

        function onKey(e) {
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                if (typing) {
                    finishTyping();
                } else {
                    cleanup();
                }
            }
        }

        function cleanup() {
            window.removeEventListener('keydown', onKey);
            overlay.classList.add('hidden');
            resolve();
        }

        window.addEventListener('keydown', onKey);
        timer = setTimeout(tick, TYPE_SPEED_MS);
    });
}
