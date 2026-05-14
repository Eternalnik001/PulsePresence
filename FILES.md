# 📂 File Guide

A one-page map of which file does what.

---

## 🎯 The Golden Rule

**You only need to edit `js/config.js`** for normal use.

Everything else is structured so you can edit one file at a time if you want to customize deeper.

---

## 📄 Every File

### `index.html` *(rarely edit)*
The structure — intro modal, header, sections for each pillar.

### `css/styles.css` *(edit for visual changes)*
Cinematic broadcast aesthetic. Single accent color: `#ff9d2e` (amber).
Top of file has CSS variables for colors / spacing / fonts.

---

### `js/config.js` ⭐ *(THE ONE FILE YOU EDIT)*
```js
OPENAI_API_KEY: "",          // ← paste key
GPT_MODEL: "gpt-4o-mini",    // change to "gpt-4o" for higher quality
DEFAULT_SPEED: 900,           // 2200=1x, 900=3x, 400=8x
DIRECTOR_INTERVAL: 6,         // narrative beat every N balls
```

---

### `js/data.js` *(edit content)*
- Parses Cricsheet JSON
- Holds **SENTIMENT_BY_EVENT** (the fan vignettes)
- Holds **CAPTAIN_DECISIONS** (tactical prompts)

**Edit if:** you want different fan voices or new tactical questions.

---

### `js/director.js` *(edit AI personality)*
The Match Director module. Look for `sys = ` lines to change the AI's voice.

---

### `js/captain.js` *(rarely edit)*
Renders the Co-Captain prompt UI. Decisions come from `data.js`.

---

### `js/wave.js` *(rarely edit)*
Stadium Wave logic. Change `triggerWave()` to alter what happens when the threshold is hit.

---

### `js/theatre.js` *(rarely edit)*
The Key Moment overlay. Edit `generateMomentContext` AI prompt to change Theatre tone.

---

### `js/engine.js` *(advanced edit)*
- `Presence` — the 4D emotion model (joy/tension/hope/disbelief)
- `Sentiment` — fan vignette feed
- `bowlBall` — the per-ball orchestrator

**Edit if:** you want to tune how events affect emotions.

---

### `js/app.js` *(rarely edit)*
Main orchestrator, state, scheduler. The "boot up everything" file.

---

### `data/match.json` *(swap to change matches)*
Cricsheet-format ball-by-ball. Currently **RCB vs CSK 2024 Bengaluru**.
Get any IPL match JSON from cricsheet.org/matches or github.com/ritesh-ojha/IPL-DATASET.

---

## 🔄 Common Edit Scenarios

| Scenario | File |
|---|---|
| Change API key | `js/config.js` |
| Change accent color | `css/styles.css` (`--accent`) |
| Change AI Director tone | `js/director.js` (sys prompt) |
| Add a new Co-Captain question | `js/data.js` (CAPTAIN_DECISIONS) |
| Add new fan vignettes | `js/data.js` (SENTIMENT_BY_EVENT) |
| Use a different match | replace `data/match.json` |
| Tune emotion impact | `js/engine.js` (Presence.update) |
| Faster default playback | `js/config.js` (DEFAULT_SPEED) |
