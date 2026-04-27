// gemini_api.js
// Google Gemini 1.5 Flash REST entegrasyonu. Tarayıcıdan doğrudan fetch ile çağrılır.
// API anahtarı .env dosyasından okunur (env_loader.js).
// UYARI: .env tarayıcıya açık servis edilir; sadece yerel geliştirme için.

import { loadEnv } from './env_loader.js';

const STORAGE_KEY_CHAT = 'knock.chatHistory';

const MODEL = 'gemini-1.5-flash';
const API_URL = (key) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

// Karakterin kimliğini ve sahnenin bağlamını kuran sistem talimatı.
// Gemini "system_instruction" alanını destekler; rol kayması olmaması için bunu kullanıyoruz.
const SYSTEM_INSTRUCTION = {
    role: "user",
    parts: [{
        text:
`Sen 1973 yılında, Amerika'da oğlunu Vietnam Savaşı'na uğurlamak üzere olan
yorgun ve hüzünlü bir annesin. Karşındaki kişi oğlun.
Konuşmaların kısa, melankolik, felsefi ve Bob Dylan'ın
"Knockin' on Heaven's Door" şarkısının veda hissini taşımalı.
Cevapların bir paragrafı geçmesin. Asla rolden çıkma, meta yorum yapma.
Türkçe konuş.`
    }]
};

// Açılış repliği — kullanıcı bunu HTML'de zaten görüyor; modelin "hatırlaması" için geçmişe yazıyoruz.
const OPENING_LINE = {
    role: "model",
    parts: [{
        text: "Gitmek zorunda olduğunu biliyorum ama içim elvermiyor evlat. Bana söylemek istediğin son bir şey var mı?"
    }]
};

// Sohbet geçmişi — localStorage'dan yükleniyor, yoksa temiz başlatılıyor.
let chatHistory = loadHistory();

function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_CHAT);
        if (raw) return JSON.parse(raw);
    } catch (_) { /* corrupt storage — sessizce yenile */ }
    return [OPENING_LINE];
}

function saveHistory() {
    try {
        localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(chatHistory));
    } catch (_) { /* quota — yoksay */ }
}

export function resetHistory() {
    chatHistory = [OPENING_LINE];
    saveHistory();
}

// .env'den anahtarı oku (cache'lenir).
export async function getApiKey() {
    const env = await loadEnv();
    return env.GEMINI_API_KEY || "";
}

/**
 * Gemini'ye oyuncunun metnini ve o anki ruhsal yükü gönderir.
 * Burden Score prompt'a enjekte edilir; LLM tonunu buna göre ayarlar.
 */
export async function getGeminiResponse(userText, currentBurden) {
    const key = await getApiKey();
    if (!key || key === "YOUR_API_KEY_HERE") {
        return "*(API anahtarı tanımlı değil. knock-project/.env dosyasına GEMINI_API_KEY=... yaz ve sayfayı yenile.)*";
    }

    // Yük seviyesine göre yönerge — model duygusal tonu ayarlasın diye.
    const toneHint =
        currentBurden >= 80 ? "Ses tonun umutsuz, kırık olsun." :
        currentBurden <= 30 ? "Ses tonun kabullenici, sakin olsun." :
                              "Ses tonun hüzünlü ama dingin olsun.";

    const contextualPrompt =
`(Oğlunun Ruhsal Yükü: %${currentBurden}. ${toneHint})
Oğlunun sözleri: "${userText}"`;

    chatHistory.push({
        role: "user",
        parts: [{ text: contextualPrompt }]
    });

    try {
        const response = await fetch(API_URL(key), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: SYSTEM_INSTRUCTION,
                contents: chatHistory,
                generationConfig: { temperature: 0.85, maxOutputTokens: 220 }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text
            ?? "*(Sessizlik...)*";

        chatHistory.push({
            role: "model",
            parts: [{ text: botReply }]
        });
        saveHistory();

        return botReply;

    } catch (error) {
        console.error("Gemini API Hatası:", error);
        // Başarısız user mesajını geçmişten geri al ki sonraki istek bozulmasın.
        chatHistory.pop();
        return "*(Sessizlik... Söyleyecek söz bulamıyor.)*";
    }
}
