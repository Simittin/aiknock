// Gemini 1.5 Flash istemcisi — sistem promptu + diyalog geçmişi alır,
// kısa şiirsel cevap döner. Hata zarafeti içerir (ağ kopması durumunda
// üstte bir uyarı satırı bırakır, oyun çökmez).

import { getApiKey } from './env-loader.js';

const MODEL = 'gemma-3-27b-it';
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
        throw new Error('VITE_GEMINI_API_KEY tanımlı değil. .env dosyasını kontrol et.');
    }

    // JSON şemasını systemPrompt'un sonuna ekliyoruz (Gemma için)
    const jsonTemplate = `
You MUST return ONLY a raw JSON object. Do not use Markdown blocks. Use this exact structure:
{
  "reply": "Senin cevabın burada olacak (string)",
  "score": 5,
  "label": "yorgun",
  "is_final": false,
  "choices": null
}
CRITICAL RULE: If the question requires a deep reflection (open-ended), set "choices": null. ONLY if you want to force the player to choose a stance, provide an array of 3 objects for choices.`;
    systemPrompt += '\n\n' + jsonTemplate;

    const contents = [];
    let isFirst = true;

    for (const turn of history) {
        let text = turn.text;
        if (isFirst && turn.role === 'user') {
            text = `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n\n[USER MESSAGE]\n${text}`;
            isFirst = false;
        }
        contents.push({ role: turn.role, parts: [{ text }] });
    }

    if (isFirst) {
        contents.push({ role: 'user', parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n\n[USER MESSAGE]\n${userText}` }] });
    } else {
        contents.push({ role: 'user', parts: [{ text: userText }] });
    }

    const body = {
        contents,
        generationConfig: {
            temperature: 0.85,
            topP: 0.92,
            maxOutputTokens: 1024,
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

    let parsed = { reply: '', score: null, label: null, is_final: false, choices: null };
    try {
        let cleanRaw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        let firstBrace = cleanRaw.indexOf('{');
        let lastBrace = cleanRaw.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanRaw = cleanRaw.substring(firstBrace, lastBrace + 1);
        }
        
        // 1. Dize (string) içindeki kaçışsız (unescaped) satır sonlarını düzelt (Gemini sıkça yapar)
        cleanRaw = cleanRaw.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
            return match.replace(/\n/g, '\\n').replace(/\r/g, '');
        });
        
        // 2. Sondaki virgülleri temizle (Trailing commas)
        cleanRaw = cleanRaw.replace(/,\s*([}\]])/g, '$1');

        parsed = JSON.parse(cleanRaw);
    } catch (e) {
        // Eğer her şeye rağmen çökerse, en agresif şekilde Regex ile ayıklayalım
        let textFallback = raw;
        
        if (/["']?is_final["']?\s*:\s*true/i.test(textFallback)) parsed.is_final = true;
        
        let scoreMatch = textFallback.match(/["']?score["']?\s*:\s*(\d+)/i);
        if (scoreMatch) parsed.score = parseInt(scoreMatch[1], 10);
        
        let labelMatch = textFallback.match(/["']?label["']?\s*:\s*["']([^"'\s]+)["']/i);
        if (labelMatch) parsed.label = labelMatch[1];
        
        let choicesMatch = textFallback.match(/["']?choices["']?\s*:\s*\[(.*?)\]/is);
        if (choicesMatch) {
            let choicesStr = choicesMatch[1];
            let choiceRegex = /["']?text["']?\s*:\s*["'](.*?)["'].*?["']?label["']?\s*:\s*["'](.*?)["']/gi;
            let m;
            parsed.choices = [];
            while ((m = choiceRegex.exec(choicesStr)) !== null) {
                parsed.choices.push({ text: m[1], label: m[2] });
            }
            if (parsed.choices.length !== 3) parsed.choices = null;
        }

        // Reply kısmını yakalamak için daha güvenli bir yöntem
        let replyMatch = textFallback.match(/["']?reply["']?\s*:\s*["']([\s\S]*?)(?:["']\s*,?\s*["']?(?:score|label|is_final|choices)["']?\s*:|["']\s*}\s*$)/is);
        if (replyMatch) {
            parsed.reply = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        } else {
            // Hiçbiri çalışmazsa geriye kalan tüm JSON artıklarını sil
            let cleanReply = textFallback
                .replace(/["']?score["']?\s*:\s*\d+\s*,?/gi, '')
                .replace(/["']?label["']?\s*:\s*["']?[^"'\n,]+["']?\s*,?/gi, '')
                .replace(/["']?is_final["']?\s*:\s*(true|false)\s*,?/gi, '')
                .replace(/["']?choices["']?\s*:\s*(null|\[[\s\S]*?\])\s*,?/gi, '')
                .replace(/["']?reply["']?\s*:\s*["']?\s*/gi, '')
                .replace(/^```(?:json)?/gi, '')
                .replace(/```$/gi, '')
                .replace(/[{}"]/g, '')
                .trim();
            parsed.reply = cleanReply;
        }
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
    let finalReply = String(parsed.reply || '').trim();
    finalReply = finalReply.replace(/\[\d+\/10[^\]]*\]/g, '').trim();

    return {
        reply:    finalReply,
        score:    typeof parsed.score === 'number' ? parsed.score : null,
        label:    parsed.label ? String(parsed.label).trim() : null,
        is_final: !!parsed.is_final,
        choices,
    };
}
