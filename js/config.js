/* ============================================================
   PulsePresence — CONFIG
   ⚠️ THIS IS THE ONLY FILE YOU NORMALLY EDIT.
============================================================ */

const CONFIG = {
  // 🔑 PASTE YOUR OPENAI KEY HERE
  // ⚠️ Demo only. Anyone opening the page can see this.
  OPENAI_API_KEY: "",   // Paste here for local static-only dev, or use proxy.py

  GPT_MODEL: "gpt-4o-mini",
  GPT_API_URL: "https://api.openai.com/v1/chat/completions",

  MATCH_DATA_PATH: "data/match.json",

  // Playback speed (ms per ball)
  // 2200 = realistic, 900 = 3x demo, 400 = 8x fast demo
  DEFAULT_SPEED: 900,

  AI_TIMEOUT_MS: 5000,

  // How often the Match Director "checks in" with a narrative
  // (in number of balls). Every 6 balls = once per over.
  DIRECTOR_INTERVAL: 6,

  // How aggressively to fire Co-Captain prompts
  // 1 = every over, 2 = every other over
  CAPTAIN_OVER_INTERVAL: 2,
};

CONFIG.AI_ENABLED = CONFIG.OPENAI_API_KEY.length > 10;
