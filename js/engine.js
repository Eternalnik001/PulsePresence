/* ============================================================
   PulsePresence — ENGINE
   Match loop, Presence emotion model, sentiment feed.
============================================================ */

// 4D Emotion Model
const Presence = {
  joy: 30, tension: 45, hope: 60, disbelief: 15,

  update(ball) {
    switch (ball.type) {
      case 'six':
        this.joy = Math.min(100, this.joy + 20 + Math.random() * 10);
        this.disbelief = Math.min(100, this.disbelief + 10);
        this.tension = Math.max(0, this.tension - 5);
        break;
      case 'four':
        this.joy = Math.min(100, this.joy + 10 + Math.random() * 5);
        this.hope = Math.min(100, this.hope + 5);
        break;
      case 'wicket':
        this.tension = Math.min(100, this.tension + 25);
        this.disbelief = Math.min(100, this.disbelief + 15);
        this.joy = Math.max(0, this.joy - 10);
        this.hope = Math.max(0, this.hope - 10);
        break;
      case 'dot':
        this.tension = Math.min(100, this.tension + 5);
        this.joy = Math.max(0, this.joy - 2);
        break;
      default:
        this.hope = Math.min(100, this.hope + 3);
        this.joy = Math.max(0, this.joy - 1);
    }
    // Natural decay
    this.joy = Math.max(10, this.joy * 0.97);
    this.tension = Math.max(10, this.tension * 0.98);
    this.hope = Math.max(10, this.hope * 0.97);
    this.disbelief = Math.max(5, this.disbelief * 0.95);

    this.render();
  },

  render() {
    document.getElementById('pulse-joy').style.width = Math.round(this.joy) + '%';
    document.getElementById('pulse-tension').style.width = Math.round(this.tension) + '%';
    document.getElementById('pulse-hope').style.width = Math.round(this.hope) + '%';
    document.getElementById('pulse-disbelief').style.width = Math.round(this.disbelief) + '%';
  }
};

// Sentiment Feed — qualitative fan vignettes
const Sentiment = {
  fire(eventType) {
    const pool = SENTIMENT_BY_EVENT[eventType] || SENTIMENT_BY_EVENT.general;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    this.addMessage(msg);
  },

  addMessage(html) {
    const feed = document.getElementById('sentiment-feed');
    const el = document.createElement('div');
    el.className = 'sentiment-msg';
    el.innerHTML = html;
    feed.insertBefore(el, feed.firstChild);

    // Keep max 5
    while (feed.children.length > 5) {
      feed.removeChild(feed.lastChild);
    }
  }
};

// Win probability (simple model)
function computeWP(state) {
  const ball = state.ballIdx >= 0 ? ALL_BALLS[state.ballIdx] : null;
  if (!ball) return 50;

  const inn = state.inningsScores[ball.innings];
  const totalBalls = (ball.over * 6) + ball.ball;

  if (ball.innings === 0) {
    // First innings: higher score = higher WP for batting team
    const runRate = totalBalls > 0 ? (inn.runs / totalBalls) * 6 : 0;
    let wp = 45 + (runRate - 7) * 5;
    wp -= inn.wkts * 4;
    return Math.max(15, Math.min(85, wp));
  } else {
    // Chase innings
    const target = state.inningsScores[0].runs + 1;
    const needed = target - inn.runs;
    const ballsLeft = 120 - totalBalls;
    if (needed <= 0) return 95;
    if (ballsLeft <= 0) return 5;
    const reqRate = (needed / ballsLeft) * 6;
    let wp = 50 - (reqRate - 8) * 8;
    wp -= inn.wkts * 6;
    return Math.max(5, Math.min(95, wp));
  }
}

// Commentary text
function generateCommentary(ball) {
  const batter = ball.batter;
  const bowler = ball.bowler;
  switch (ball.type) {
    case 'six':
      return `<span class="feed-chip b6">6</span> <strong>${batter}</strong> launches ${bowler} for a massive SIX!`;
    case 'four':
      return `<span class="feed-chip b4">4</span> <strong>${batter}</strong> finds the boundary off ${bowler}!`;
    case 'wicket':
      return `<span class="feed-chip bW">W</span> <strong>OUT!</strong> ${ball.playerOut} — ${ball.wicketKind} off ${bowler}`;
    case 'dot':
      return `<span class="feed-chip">·</span> Dot ball. ${bowler} keeps it tight to ${batter}.`;
    case 'one':
      return `<span class="feed-chip">1</span> ${batter} rotates strike off ${bowler}.`;
    case 'two':
      return `<span class="feed-chip">2</span> ${batter} picks up two runs off ${bowler}.`;
    default:
      return `<span class="feed-chip">${ball.runs}</span> ${batter} gets ${ball.runs} off ${bowler}.`;
  }
}

// ============================================================
// BOWL A BALL — the per-ball orchestrator
// ============================================================
function bowlBall(state) {
  if (state.ballIdx >= ALL_BALLS.length - 1) {
    clearInterval(state.timer);
    state.playing = false;
    document.getElementById('play-btn').textContent = '▶ PLAY';
    showToast('Match complete!');
    return;
  }

  state.ballIdx++;
  const ball = ALL_BALLS[state.ballIdx];
  state.balls.push(ball);

  // Update innings score
  if (!state.inningsScores[ball.innings]) {
    state.inningsScores[ball.innings] = { runs: 0, wkts: 0 };
    // Innings change
    if (ball.innings === 1) {
      showToast('Innings break — ' + shortTeam(TEAM2) + ' come out to bat');
    }
  }
  const inn = state.inningsScores[ball.innings];
  if (ball.type === 'wicket') inn.wkts++;
  else if (typeof ball.runs === 'number') inn.runs += ball.runs;

  // Win probability
  state.wp = computeWP(state);

  // Update scoreboard
  updateScoreboard(state);

  // Commentary
  document.getElementById('feed-current').innerHTML = generateCommentary(ball);
  document.getElementById('feed-ball-meta').textContent = `${ball.over}.${ball.ball}`;

  // Ball strip
  const strip = document.getElementById('feed-strip');
  const chip = document.createElement('div');
  chip.className = 'feed-chip';
  if (ball.type === 'four') chip.classList.add('b4');
  if (ball.type === 'six') chip.classList.add('b6');
  if (ball.type === 'wicket') chip.classList.add('bW');
  chip.textContent = ball.type === 'wicket' ? 'W' : (ball.type === 'dot' ? '·' : ball.runs);
  strip.appendChild(chip);
  strip.scrollLeft = strip.scrollWidth;

  // Presence emotion
  Presence.update(ball);

  // Sentiment feed (on big events)
  if (['six', 'four', 'wicket'].includes(ball.type)) {
    Sentiment.fire(ball.type);
  } else if (Math.random() < 0.15) {
    Sentiment.fire('dot');
  }

  // Key Moment Theatre (sixes and wickets only)
  if (ball.type === 'six' || ball.type === 'wicket') {
    Theatre.show(ball, state);
    Wave.onBigMoment();
  }

  // Director narrative (every N balls)
  if (state.ballIdx > 0 && state.ballIdx % CONFIG.DIRECTOR_INTERVAL === 0) {
    generateNarrative(state);
  }

  // Co-Captain (on over boundaries)
  if (ball.ball === 6) {
    const decision = Captain.shouldShow(ball.over + 1);
    if (decision) {
      setTimeout(() => Captain.show(decision), 600);
    }
  }

  // Header presence count (simulated)
  const base = 847231;
  const jitter = Math.floor(Math.random() * 5000 - 2500);
  document.getElementById('header-presence').textContent =
    (base + jitter + state.ballIdx * 12).toLocaleString() + ' inside';
}

// Update scoreboard UI
function updateScoreboard(state) {
  const ball = ALL_BALLS[state.ballIdx];
  const inn0 = state.inningsScores[0] || { runs: 0, wkts: 0 };
  const inn1 = state.inningsScores[1] || null;

  // Batting team (current innings)
  const batTeam = shortTeam(ball.battingTeam);
  const batInn = state.inningsScores[ball.innings];
  document.getElementById('sb-bat-name').textContent = batTeam;
  document.getElementById('sb-bat-score').textContent = `${batInn.runs}/${batInn.wkts}`;
  document.getElementById('sb-bat-overs').textContent = `${ball.over}.${ball.ball} ov`;

  // Bowling team
  const bowlTeam = ball.innings === 0 ? shortTeam(TEAM2) : shortTeam(TEAM1);
  document.getElementById('sb-bowl-name').textContent = bowlTeam;
  if (ball.innings === 0) {
    document.getElementById('sb-bowl-score').textContent = 'yet to bat';
    document.getElementById('sb-bowl-overs').textContent = '—';
  } else {
    document.getElementById('sb-bowl-score').textContent = `${inn0.runs}/${inn0.wkts}`;
    document.getElementById('sb-bowl-overs').textContent = 'completed';
  }

  // Meta
  const inningsLabel = ball.innings === 0 ? '1st Innings' : '2nd Innings';
  const wpTeam = shortTeam(ball.battingTeam);
  document.getElementById('sb-meta').textContent = `Live · ${inningsLabel}`;

  // Director team display
  if (state.userTeam && state.userTeam !== 'neutral') {
    document.getElementById('director-team').textContent = state.userTeam.toUpperCase();
  }
}

// Toast helper
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}
