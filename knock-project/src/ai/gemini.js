// Gemini 1.5 Flash istemcisi — sistem promptu + diyalog geçmişi alır,
// kısa şiirsel cevap döner. Hata zarafeti içerir (ağ kopması durumunda
// üstte bir uyarı satırı bırakır, oyun çökmez).

import { getApiKey } from './env-loader.js';

const MODEL = 'gemini-2.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const QA_SCHEMA = {
    type: 'object',
    properties: {
        reply:    { type: 'string' },
        score:    { type: 'integer' },
        label:    { type: 'string' },
        is_final: { type: 'boolean' },
        choices: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    text:  { type: 'string' },
                    label: { type: 'string' },
                },
                required: ['text'],
            },
        },
    },
    required: ['reply', 'is_final'],
};

export async function callGeminiQA({ systemPrompt, history, userText }) {
    const key = await getApiKey();
    if (!key || key === 'YOUR_API_KEY_HERE') {
        throw new Error('GEMINI_API_KEY tanımlı değil. knock-project/.env dosyasını kontrol et.');
    }

    const contents = [];
    for (const turn of history) {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
    }
    contents.push({ role: 'user', parts: [{ text: userText }] });

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
            temperature: 0.85,
            topP: 0.92,
            maxOutputTokens: 512,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
            responseSchema: QA_SCHEMA,
        },
    };

    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Gemini boş cevap döndürdü.');

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        // Şema fallback — beklenmedik bir metin gelirse kırılma
        return { reply: raw.trim(), is_final: false };
    }
    let choices = null;
    if (Array.isArray(parsed.choices) && parsed.choices.length === 3) {
        choices = parsed.choices
            .filter((c) => c && c.text)
            .map((c) => ({
                text:  String(c.text).trim(),
                label: c.label ? String(c.label).trim() : '',
            }));
        if (choices.length !== 3) choices = null;
    }
    return {
        reply:    String(parsed.reply || '').trim(),
        score:    typeof parsed.score === 'number' ? parsed.score : null,
        label:    parsed.label ? String(parsed.label).trim() : null,
        is_final: !!parsed.is_final,
        choices,
    };
}
