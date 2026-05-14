const CONFIG = {
  // BFF proxy endpoint — Gemini key lives server-side only
  CHAT_API_URL: "/api/chat",

  MATCH_DATA_PATH: "data/match.json",

  // Playback speed (ms per ball)
  DEFAULT_SPEED: 900,

  AI_TIMEOUT_MS: 12000,
  DIRECTOR_INTERVAL: 6,
  CAPTAIN_OVER_INTERVAL: 2,
};

// AI is always enabled via the proxy; the proxy decides whether to call Gemini
CONFIG.AI_ENABLED = true;
