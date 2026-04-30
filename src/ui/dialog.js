// Q&A + puanlama + açık/şıklı karışık diyalog kutusu.
//
// Açık uçlu turda: input görünür, oyuncu yazar.
// Şıklı turda: input gizlenir, 3 seçenek render olur, 1/2/3 ile seçilir.
// Seçilen şık normal cevap gibi sentiment + AI puanlamasına gider (uniform).

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
let locked = false;
let onCloseCb = null;
let dotTimer = null;
let autoCloseTimer = null;
let activeChoices = null;     // [{text, label}] | null

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

function setHint(text) { $('dialog-hint').textContent = text; }

// --- Açık vs şıklı UI mod geçişleri ---
function hideInputArea() {
    $('dialog-input-area').style.display = 'none';
    $('dialog-input').disabled = true;
}

function showInputArea() {
    $('dialog-input-area').style.display = '';
    $('dialog-input').disabled = false;
    $('dialog-input').focus();
}

function clearChoices() {
    const block = $('dialog-text').querySelector('.dlg-choices');
    if (block) block.remove();
    activeChoices = null;
}

function renderChoices(choices) {
    clearChoices();
    const log = $('dialog-text');
    const block = document.createElement('div');
    block.className = 'dlg-choices';
    choices.forEach((c, i) => {
        const line = document.createElement('div');
        line.className = 'dlg-choice';
        const num = document.createElement('span');
        num.className = 'dlg-choice-num';
        num.textContent = `[${i + 1}]`;
        const txt = document.createElement('span');
        txt.className = 'dlg-choice-text';
        txt.textContent = ' ' + c.text;
        line.appendChild(num);
        line.appendChild(txt);
        block.appendChild(line);
    });
    log.appendChild(block);
    log.scrollTop = log.scrollHeight;
    activeChoices = choices;
}

// --- Klavye dinleyicileri ---
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

function onChoiceKey(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeDialog();
        return;
    }
    if (!activeChoices) return;
    const idx = ['1', '2', '3'].indexOf(e.key);
    if (idx === -1 || !activeChoices[idx]) return;
    e.preventDefault();
    e.stopPropagation();
    selectChoice(idx);
}

// --- Akış ---
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
    hideInputArea();
    clearChoices();
    startThinking();

    try {
        if (!isOpening) {
            analyzeAndApply(userText).catch((err) => console.warn('Sentiment hata:', err));
        }

        const systemPrompt = buildSystem();
        const data = await callGeminiQA({ systemPrompt, history, userText });

        history.push({ role: 'user',  text: userText });
        history.push({ role: 'model', text: data.reply });

        stopThinking();

        if (!isOpening && (typeof data.score === 'number' || data.label)) {
            annotateLastPlayer(data.score, data.label);
            recordTurn(activeObject.id, data.score, data.label);
        }

        appendLine(data.reply, activeObject.role === 'mom' ? 'dlg-mom' : 'dlg-voice');

        if (data.is_final) {
            locked = true;
            markCompleted(activeObject.id);
            appendLine('— Bu yansımayı tamamladın —', 'dlg-system');
            setHint('[ESC] AYRIL');
            hideInputArea();
            scheduleAutoClose();
        } else if (data.choices) {
            renderChoices(data.choices);
            setHint('[1/2/3] SEÇ     [ESC] AYRIL');
        } else {
            showInputArea();
            setHint('[ENTER] CEVAPLA     [ESC] AYRIL');
        }
    } catch (err) {
        stopThinking();
        appendLine(`> ${err.message || 'Bağlantı koptu.'}`, 'dlg-error');
        if (!locked) showInputArea();
    } finally {
        busy = false;
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

async function selectChoice(idx) {
    if (busy || locked) return;
    const choice = activeChoices[idx];
    clearChoices();
    appendLine(choice.text, 'dlg-player');
    answeredCount++;
    await fetchReply(choice.text, false);
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
    activeChoices = null;
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
    window.addEventListener('keydown', onChoiceKey);

    ensureSentimentLoaded().catch(() => { /* sessizce geç */ });

    await fetchReply(openingNudge(activeObject.role), true);
}

export function closeDialog() {
    if (!isDialogOpen()) return;
    $('dialog-overlay').classList.add('hidden');
    $('dialog-input').removeEventListener('keydown', onInputKey);
    window.removeEventListener('keydown', onChoiceKey);
    stopThinking();
    clearChoices();
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
