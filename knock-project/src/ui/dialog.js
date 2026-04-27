// Q&A + puanlama diyalog kutusu.
//
// Akış:
//   open -> opener gösterilir + AI ilk repliği (introduce + Q1)
//   user submit -> sentiment (arka plan) + Gemini JSON
//                  -> reply + score badge (oyuncunun mesajının yanına)
//                  -> sıradaki soru
//   is_final=true -> closing reply + "Bu yansımayı tamamladın" + auto-close

import { callGeminiQA } from '../ai/gemini.js';
import { analyzeAndApply, ensureSentimentLoaded } from '../ai/sentiment.js';
import { getBurden } from '../state/burden.js';
import { getPlayerName } from '../state/profile.js';
import { recordTurn, markCompleted } from '../state/scores.js';
import { buildInnerVoicePrompt, buildMomPrompt, openingNudge } from '../ai/prompts.js';
import { objects as OBJECT_DB } from '../objects/index.js';
import { clearPendingKeys } from '../engine/input.js';

const AUTO_CLOSE_MS = 6500;

let activeObject = null;
let history = [];
let answeredCount = 0;
let busy = false;
let locked = false;     // kapanış sonrası input dondurulur
let onCloseCb = null;
let dotTimer = null;
let autoCloseTimer = null;

const $ = (id) => document.getElementById(id);

// --- DOM yardımcıları ---
function appendLine(text, cls) {
    const log = $('dialog-text');
    const p = document.createElement('p');
    p.className = `dlg-line ${cls}`;
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    return p;
}

function annotateLastPlayer(score, label) {
    if (typeof score !== 'number' && !label) return;
    const log = $('dialog-text');
    const playerLines = log.querySelectorAll('.dlg-player');
    const last = playerLines[playerLines.length - 1];
    if (!last) return;
    const badge = document.createElement('span');
    badge.className = 'dlg-score';
    const s = typeof score === 'number' ? `${score}/10` : '';
    const l = label ? (s ? ' — ' : '') + label.toUpperCase() : '';
    badge.textContent = ` [${s}${l}]`;
    last.appendChild(badge);
}

function startThinking() {
    const log = $('dialog-text');
    const p = document.createElement('p');
    p.className = 'dlg-line dlg-thinking';
    p.id = 'dlg-thinking';
    p.textContent = '...';
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    let n = 0;
    dotTimer = setInterval(() => {
        n = (n + 1) % 4;
        p.textContent = '.'.repeat(n + 1);
    }, 350);
}

function stopThinking() {
    if (dotTimer) { clearInterval(dotTimer); dotTimer = null; }
    const t = $('dlg-thinking');
    if (t) t.remove();
}

function setHint(text) {
    $('dialog-hint').textContent = text;
}

function setInputDisabled(disabled) {
    const inp = $('dialog-input');
    inp.disabled = disabled;
    if (!disabled) inp.focus();
}

// --- Diyalog yönetimi ---
function buildSystem() {
    const def = activeObject;
    const burden = getBurden();
    const name = getPlayerName() || 'asker';
    const target = def.questionTarget || 3;
    const ctx = { playerName: name, burden, answeredCount, target, objectDef: def };
    if (def.role === 'mom') return buildMomPrompt(ctx);
    return buildInnerVoicePrompt(ctx);
}

async function fetchReply(userText, isOpening) {
    busy = true;
    setInputDisabled(true);
    startThinking();

    try {
        if (!isOpening) {
            // Sentiment arka planda — Gemini'yi blokelemez
            analyzeAndApply(userText).catch((err) => console.warn('Sentiment hata:', err));
        }

        const systemPrompt = buildSystem();
        const data = await callGeminiQA({
            systemPrompt,
            history,
            userText,
        });

        history.push({ role: 'user',  text: userText });
        history.push({ role: 'model', text: data.reply });

        stopThinking();

        // Skor rozeti — oyuncunun bir önceki cümlesine eklenir
        if (!isOpening && (typeof data.score === 'number' || data.label)) {
            annotateLastPlayer(data.score, data.label);
            recordTurn(activeObject.id, data.score, data.label);
        }

        appendLine(data.reply, activeObject.role === 'mom' ? 'dlg-mom' : 'dlg-voice');

        if (data.is_final) {
            // Kapanış: input kilitlenir, tamamlama mesajı + auto-close
            locked = true;
            markCompleted(activeObject.id);
            appendLine('— Bu yansımayı tamamladın —', 'dlg-system');
            setHint('[ESC] AYRIL');
            setInputDisabled(true);
            scheduleAutoClose();
        } else {
            setHint('[ENTER] CEVAPLA     [ESC] AYRIL');
        }
    } catch (err) {
        stopThinking();
        appendLine(`> ${err.message || 'Bağlantı koptu.'}`, 'dlg-error');
    } finally {
        busy = false;
        if (!locked) setInputDisabled(false);
    }
}

function scheduleAutoClose() {
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(() => closeDialog(), AUTO_CLOSE_MS);
}

async function onSubmit() {
    if (busy || locked) return;
    const input = $('dialog-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendLine(text, 'dlg-player');
    answeredCount++;
    await fetchReply(text, false);
}

function onInputKey(e) {
    e.stopPropagation();
    if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog();
    }
}

export function isDialogOpen() {
    return !$('dialog-overlay').classList.contains('hidden');
}

export async function openConversation({ objectId, onClose }) {
    if (isDialogOpen()) return;
    activeObject = OBJECT_DB[objectId];
    if (!activeObject) return;
    history = [];
    answeredCount = 0;
    busy = false;
    locked = false;
    onCloseCb = onClose || null;

    $('dialog-title').textContent = activeObject.name.toUpperCase();
    const log = $('dialog-text');
    log.innerHTML = '';
    appendLine(activeObject.opener, 'dlg-system');

    setHint('[ENTER] CEVAPLA     [ESC] AYRIL');
    $('dialog-overlay').classList.remove('hidden');
    $('dialog-input').value = '';
    $('dialog-input').placeholder = 'cevap yaz...';
    $('dialog-input').addEventListener('keydown', onInputKey);

    ensureSentimentLoaded().catch(() => { /* hata UI'da gösterilir */ });

    await fetchReply(openingNudge(activeObject.role), true);
}

export function closeDialog() {
    if (!isDialogOpen()) return;
    $('dialog-overlay').classList.add('hidden');
    $('dialog-input').removeEventListener('keydown', onInputKey);
    stopThinking();
    if (autoCloseTimer) { clearTimeout(autoCloseTimer); autoCloseTimer = null; }
    const cb = onCloseCb;
    activeObject = null;
    history = [];
    answeredCount = 0;
    busy = false;
    locked = false;
    onCloseCb = null;
    clearPendingKeys();
    if (cb) cb();
}
