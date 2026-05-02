# 1973: Veda Yolu

> *"Mama, take this badge off of me — I can't use it anymore."*
> — Bob Dylan, Knockin' on Heaven's Door (1973)

**1973: Veda Yolu** is a narrative-driven 2D pixel-art game in which the player embodies a soldier preparing to leave home for the Vietnam War. Every object in the house carries a memory. Every conversation adds — or eases — an invisible weight called **Burden**. When you finally reach the door, what you carry decides who you become.

The game is built as a CSE 358 Introduction to Artificial Intelligence creative project, placing two distinct generative AI systems at the heart of both gameplay and emotional storytelling.

---

## Artistic Statement

The song "Knockin' on Heaven's Door" was written for a dying sheriff in Sam Peckinpah's *Pat Garrett & Billy the Kid* (1973) — a film set in the American Southwest, shot in the same year America's involvement in Vietnam was winding down under the weight of 58,000 deaths. Dylan condensed that entire era into four lines and a melody that has outlived every war it was played at.

This project does not retell Dylan's story. It borrows his question: *What do you put down before you walk through the door?*

The Burden mechanic is the answer made playable. Sentiment analysis reads the emotional truth of your words. The LLM gives voice to the objects you leave behind. When you are heavy with unspoken grief, you move slowly. When you let go, you walk freely. The door is the same for everyone. How you arrive at it is not.

---

## AI Techniques

This project combines two distinct generative AI techniques that are tightly coupled through the Burden state machine:

### 1. Large Language Model — Google Gemini

- **Model:** `gemma-3-27b-it` via Google Generative Language API
- **Role:** Generates all in-game dialogue in real time
- **Implementation:** `src/ai/gemini.js`, `src/ai/prompts.js`

Two distinct prompt modes are used:

| Mode | Character | Function |
|------|-----------|----------|
| `inner_voice` | The soldier's internal monologue | Reflects on an object's personal meaning, asks open or choice-based questions |
| `mom` | The player's mother | Responds to the player's confessions with warmth and non-judgment |

Structured JSON output (schema-validated) returns: `reply`, `score`, `label`, `is_final`, `choices`. The system prompt encodes the current Burden level so that dialogue tone shifts dynamically — a heavily burdened player receives darker, more melancholic responses.

### 2. Sentiment Analysis — Transformers.js (BERT)

- **Model:** `Xenova/bert-base-multilingual-uncased-sentiment` (ONNX, runs entirely in-browser)
- **Role:** Classifies the emotional valence of player text input (1–5 stars)
- **Implementation:** `src/ai/sentiment.js`

The sentiment score maps asymmetrically to Burden delta — negative responses carry disproportionately more weight than positive responses can relieve (mirroring the real psychology of grief):

| Sentiment | Stars | Burden Δ |
|-----------|-------|----------|
| Very negative | ⭐ | +28 |
| Negative | ⭐⭐ | +14 |
| Neutral | ⭐⭐⭐ | +4 |
| Positive | ⭐⭐⭐⭐ | −4 |
| Very positive | ⭐⭐⭐⭐⭐ | −8 |

### How the Two Techniques Interact

```
Player types response
        │
        ▼
┌───────────────────┐
│  Transformers.js  │  ← runs in-browser (no API)
│  Sentiment BERT   │
└────────┬──────────┘
         │ star rating (1–5)
         ▼
┌───────────────────┐
│   Burden State    │  ← 0–100 emotional load
│   (asymmetric Δ)  │
└────────┬──────────┘
         │ burden score injected into system prompt
         ▼
┌───────────────────┐
│   Gemini LLM      │  ← generates next dialogue turn
│   (Gemma-3-27B)   │
└────────┬──────────┘
         │ reply + next question
         ▼
  Player sees response;
  movement speed = base × max(0.15, 1 − burden/100)
```

Neither technique alone produces the experience. The LLM without sentiment analysis would be a chatbot. The sentiment analysis without the LLM would be a meter. Together, they form a loop where the player's emotional honesty shapes the story's language and the body's movement.

---

## Gameplay Overview

1. **Registration** — Enter your name through a military CELP terminal (1973 aesthetic)
2. **Prologue** — A brief narrative sets the historical context: the war, the conscription, the last night at home
3. **Exploration** — Navigate a pixel-art home (bedroom, kitchen, living room) using WASD
4. **Reflection** — Press `E` near any of the 8 interactive objects to begin a dialogue
5. **Ending** — Complete all 7 reflections, then approach the front door

Two endings exist, determined by your final Burden score (threshold: 50):

| Ending | Condition | Experience |
|--------|-----------|------------|
| **Light** | Burden < 50 | Walk freely to a white door; peaceful folk credits |
| **Heavy** | Burden ≥ 50 | Slow, agonized shuffle; screen turns red; glitch effects |

---

## Technical Architecture

```
index.html          Game shell, CRT overlay, modal layers
src/
  main.js           Boot orchestration, Burden UI, music pre-generation
  ai/
    gemini.js       Gemini API client, JSON schema enforcement, fallback parsing
    sentiment.js    Transformers.js loader, BERT inference, Burden delta mapping
    prompts.js      System prompts for inner_voice / mom modes, Q&A patterns
  engine/
    game.js         Main game loop (requestAnimationFrame)
    renderer.js     Canvas 2D drawing (320×192 native, 2× scaled)
    collision.js    Tile-based AABB collision
    input.js        Keyboard state manager
    player.js       Movement, Burden-linked speed formula
  objects/          8 interactive objects + 5 Easter egg objects
  rooms/            bedroom, kitchen, living_room tile maps and object placement
  state/
    burden.js       Burden accumulation, clamping, threshold events
    scores.js       Per-object conversation history
    profile.js      Player name, session persistence
  audio/
    ambient.js      Procedural rain (2-layer LFO), atmospheric drone
    sfx.js          Footsteps, interaction chimes, burden-spike heartbeat
    ending-music.js Burden-conditional folk synthesis (G/D/Am7/C) + optional MusicGen
  ui/
    dialog.js       Modal system, open/choice rendering, typing animation
    intro.js        Narrative intro sequence
    name-prompt.js  CELP registration UI
    finale.js       Ending sequence, credits
    lore.js         Historical context overlays
  assets/
    sprites.js      Pixel sprite definitions (player, objects, tiles)
styles/
  main.css          CRT scanline, phosphor green (#FFB000), burden-red (#FF5722)
```

**Stack:** Vanilla JavaScript (no framework), HTML5 Canvas, Web Audio API, Vite bundler.

---

## Installation & Setup

### Prerequisites

- Node.js ≥ 18
- A Google Gemini API key ([get one here](https://aistudio.google.com/))
- (Optional) A Replicate API token for AI-generated ending music

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Simittin/aiknock.git
cd aiknock

# 2. Install dependencies
npm install

# 3. Configure API keys
cp .env.example .env
```

Edit `.env`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_REPLICATE_API_TOKEN=optional_replicate_token
```

> **Note:** The Replicate token is optional. If omitted, the ending music falls back to fully procedural Web Audio synthesis — no functionality is lost.

```bash
# 4. Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

### Debug Utilities

In the browser console:

```js
cheat.lightEnd()   // skip to light ending (low burden)
cheat.heavyEnd()   // skip to heavy ending (high burden)
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^6.x | Build tool & dev server |
| `@xenova/transformers` | ^2.x | In-browser BERT sentiment model (ONNX) |

**External APIs:**

| API | Required | Usage |
|-----|----------|-------|
| Google Gemini (`gemma-3-27b-it`) | Yes | NPC dialogue generation |
| Replicate MusicGen | No | AI-composed ending music (fallback: procedural) |

> The sentiment model (`Xenova/bert-base-multilingual-uncased-sentiment`) is downloaded and cached in the browser on first load (~90 MB). Subsequent loads use the cached version.

---

## Historical Context

The project is set in 1973 — the year Dylan wrote the song, the year *Pat Garrett & Billy the Kid* was filmed, and the year the Paris Peace Accords brought an official (if hollow) end to America's combat role in Vietnam.

The game is not about the war directly. It is about the last night before departure — the objects on a shelf, the words left unsaid to a mother, the weight accumulated by a generation asked to carry things no one should carry. Dylan's song compresses that weight into a single metaphor: *put down the badge*. This game asks the player to decide what their badge is.

The Burden mechanic, the asymmetric sentiment mapping, and the two endings are not game-design choices in isolation — they are structural arguments about the moral weight of that era.

---

## Team

| Name | Role |
|------|------|
| Ahmet Melih Bostancıeri | AI integration, game engine, audio systems |
| Egemen | Narrative design, object dialogue, historical research |
| Yunus | Visual design, sprite art, UI/UX |

---

## License

Developed for CSE 358 Introduction to Artificial Intelligence, Spring 2025–2026.
