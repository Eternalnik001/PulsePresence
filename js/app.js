/* ============================================================
   PulsePresence — APP
   Boot, state, event wiring.
============================================================ */

// Global match state
const state = {
  ballIdx: -1,
  balls: [],
  inningsScores: {},
  wp: 50,
  speed: CONFIG.DEFAULT_SPEED,
  playing: false,
  timer: null,
  userTeam: null
};

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Load match data
  const loaded = await loadMatchData();
  if (loaded) {
    document.getElementById('intro-match-teams').textContent =
      shortTeam(TEAM2) + '  vs  ' + shortTeam(TEAM1);
    document.getElementById('intro-match-venue').textContent =
      VENUE.split(',')[0].toUpperCase() + ' · CRICSHEET REPLAY';
  } else {
    document.getElementById('intro-match-teams').textContent = 'Failed to load match';
  }

  // AI status
  const aiEl = document.getElementById('intro-ai');
  if (CONFIG.AI_ENABLED) {
    aiEl.textContent = '✦ AI MATCH DIRECTOR: ONLINE';
    aiEl.className = 'intro-ai on';
  } else {
    aiEl.textContent = '✦ AI OFFLINE — paste key in js/config.js';
    aiEl.className = 'intro-ai off';
  }

  // Team pick buttons
  document.querySelectorAll('.team-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.team-pick-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.userTeam = btn.dataset.team;
      document.getElementById('intro-cta').disabled = false;
      document.getElementById('director-team').textContent = state.userTeam.toUpperCase();
    });
  });

  // Speed buttons
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.speed = parseInt(btn.dataset.speed);
      if (state.playing) {
        clearInterval(state.timer);
        state.timer = setInterval(() => bowlBall(state), state.speed);
      }
    });
  });

  // Play button
  document.getElementById('play-btn').addEventListener('click', togglePlay);

  // Ask input enter key
  document.getElementById('ask-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') askDirector();
  });

  // Init wave
  Wave.init();
});

// ============================================================
// ENTER THE STADIUM
// ============================================================
function enterStadium() {
  if (!state.userTeam) return;
  document.getElementById('intro').classList.add('hide');

  // Initial director narrative
  setTimeout(() => {
    generateNarrative(state);
    Sentiment.fire('general');
  }, 800);
}

// ============================================================
// PLAY / PAUSE
// ============================================================
function togglePlay() {
  if (state.playing) {
    clearInterval(state.timer);
    state.playing = false;
    document.getElementById('play-btn').textContent = '▶ PLAY';
  } else {
    state.playing = true;
    document.getElementById('play-btn').textContent = '⏸ PAUSE';
    state.timer = setInterval(() => bowlBall(state), state.speed);
  }
}
