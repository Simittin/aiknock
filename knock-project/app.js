// app.js
// Ana oyun döngüsü:
//  1) Transformers.js ile tarayıcı içi duygu analizi (Burden Score)
//  2) Gemini 1.5 Flash ile diyalog üretimi (gemini_api.js)

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';
import { getGeminiResponse, getApiKey } from './gemini_api.js';

// Modelleri her seferinde indirmek yerine tarayıcı cache'ine al.
env.allowLocalModels = false;
env.useBrowserCache  = true;

// Spec'te belirtilen sentiment modeli — kasıtlı olarak sabitliyoruz.
const SENTIMENT_MODEL = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

const STORAGE_KEY_BURDEN = 'knock.burdenScore';

// --- DOM ---
const storyBox        = document.getElementById('story-box');
const playerInput     = document.getElementById('player-input');
const sendBtn         = document.getElementById('send-btn');
const burdenScoreSpan = document.getElementById('burden-score');
const burdenFill      = document.getElementById('burden-fill');

// --- Durum ---
let burdenScore = loadBurden();
let sentimentAnalyzer = null;

updateBurdenUI();

// --- Yardımcılar ---
function loadBurden() {
    const v = parseInt(localStorage.getItem(STORAGE_KEY_BURDEN), 10);
    return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
}
function saveBurden() {
    localStorage.setItem(STORAGE_KEY_BURDEN, String(burdenScore));
}

function appendMessage(sender, text, className) {
    const p = document.createElement('p');
    p.className = className;
    p.innerHTML = sender
        ? `<strong>${sender}:</strong> ${escapeHtml(text)}`
        : escapeHtml(text);
    storyBox.appendChild(p);
    storyBox.scrollTop = storyBox.scrollHeight;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Yük değişimine göre renk (yeşil → sarı → kırmızı), bar genişliği ve gövde uyarı sınıfı.
function updateBurdenUI() {
    burdenScoreSpan.innerText = burdenScore;
    burdenFill.style.width = `${burdenScore}%`;

    // Yeşilden kırmızıya doğru lineer geçiş.
    const r = Math.round(51 + (255 - 51) * (burdenScore / 100));
    const g = Math.round(255 - (255 - 50) * (burdenScore / 100));
    burdenFill.style.background = `rgb(${r}, ${g}, 51)`;

    document.body.classList.toggle('high-burden', burdenScore >= 70);
}

// --- AI: Sentiment ---
async function initAI() {
    appendMessage('Sistem', 'Hatıralar yükleniyor... (YZ modeli indiriliyor, ilk seferde biraz sürebilir)', 'system-msg');
    try {
        sentimentAnalyzer = await pipeline('sentiment-analysis', SENTIMENT_MODEL);
        appendMessage('Sistem', 'Bağlantı kuruldu. Yıl 1973.', 'system-msg');
        const key = await getApiKey();
        if (!key || key === "YOUR_API_KEY_HERE") {
            appendMessage('Sistem',
                "Gemini API anahtarı tanımlı değil. knock-project/.env dosyasına GEMINI_API_KEY=... yaz ve sayfayı yenile.",
                'system-msg');
        }
        playerInput.disabled = false;
        sendBtn.disabled = false;
        playerInput.focus();
    } catch (err) {
        console.error(err);
        appendMessage('Sistem', 'Model yüklenemedi. İnternet bağlantını kontrol et.', 'error-msg');
    }
}

async function calculateBurden(text) {
    if (!sentimentAnalyzer) return;
    const [result] = await sentimentAnalyzer(text);
    // Skoru güvene göre ölçekle: yüksek güvenli NEGATIVE daha çok yük getirir.
    const delta = result.label === 'NEGATIVE'
        ?  Math.round(20 * result.score)
        : -Math.round(15 * result.score);

    burdenScore = Math.max(0, Math.min(100, burdenScore + delta));
    saveBurden();
    updateBurdenUI();
}

// --- Ana döngü ---
async function handleSubmit() {
    const text = playerInput.value.trim();
    if (!text) return;

    appendMessage('Sen', text, 'player-msg');
    playerInput.value = '';
    playerInput.disabled = true;
    sendBtn.disabled = true;

    try {
        await calculateBurden(text);
        const reply = await getGeminiResponse(text, burdenScore);
        appendMessage('Anne', reply, 'npc-msg');
    } catch (err) {
        console.error(err);
        appendMessage('Sistem', 'Bir hata oluştu.', 'error-msg');
    } finally {
        playerInput.disabled = false;
        sendBtn.disabled = false;
        playerInput.focus();
    }
}

sendBtn.addEventListener('click', handleSubmit);
playerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSubmit();
});

initAI();
