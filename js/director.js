/* ============================================================
   PulsePresence — MATCH DIRECTOR
   The personalized AI narrator. The killer feature.
============================================================ */

// Director state (independent of match state)
const Director = {
  chapter: 'PROLOGUE',
  emotion: 'ANTICIPATION',
  lastNarrativeBallIdx: -1,

  // Track user's emotional journey
  userReactions: [],   // [{ballIdx, emoji}]
  userPicks: [],        // captain picks
  userQuestions: [],    // asked questions

  // Compute current chapter based on match phase
  computeChapter(state, ball){
    if (!ball) return 'PROLOGUE';
    if (ball.innings === 0){
      if (ball.over <= 5)  return 'POWERPLAY';
      if (ball.over <= 14) return 'MIDDLE OVERS';
      return 'DEATH OVERS';
    } else {
      if (ball.over <= 5)  return 'THE CHASE BEGINS';
      if (ball.over <= 14) return 'MIDDLE OF THE CHASE';
      return 'CLIMAX';
    }
  },

  // Compute "what should the user be feeling right now"
  computeEmotion(state){
    const wp = state.wp;
    const userTeam = state.userTeam;
    const battingShort = state.ballIdx >= 0 ? shortTeam(ALL_BALLS[state.ballIdx].battingTeam) : null;
    if (userTeam === 'neutral') return 'CURIOUS';

    // Approximate user's perspective
    const isUserBatting = (userTeam === battingShort?.toLowerCase());
    const adjustedWp = isUserBatting ? wp : (100 - wp);

    if (adjustedWp > 75) return 'EUPHORIC';
    if (adjustedWp > 60) return 'CONFIDENT';
    if (adjustedWp > 45) return 'HOPEFUL';
    if (adjustedWp > 30) return 'TENSE';
    return 'ANXIOUS';
  },

  // Get a quick fallback narrative if GPT fails
  fallbackNarrative(state){
    const ball = state.ballIdx >= 0 ? ALL_BALLS[state.ballIdx] : null;
    const userTeam = state.userTeam === 'neutral' ? 'the match' : state.userTeam.toUpperCase();

    if (!ball){
      return `The match is about to begin. You're watching <strong>${shortTeam(TEAM2)} vs ${shortTeam(TEAM1)}</strong>. Two histories, one night.`;
    }

    const phase = Director.computeChapter(state, ball);
    const score = `${state.inningsScores[ball.innings].runs}/${state.inningsScores[ball.innings].wkts}`;

    const variants = [
      `<em>${phase}.</em> ${shortTeam(ball.battingTeam)} at ${score}. The next over could change the story.`,
      `Score: <strong>${score}</strong>. ${ball.batter} is finding his rhythm. ${userTeam} fans are watching every ball.`,
      `<em>The tension thickens.</em> Every dot ball feels heavier now. ${ball.bowler} knows it.`
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }
};

// ============================================================
// Proxy caller (calls local Python BFF)
// ============================================================
async function callGPT(systemPrompt, userPrompt, maxTokens = 200){
  if (!CONFIG.AI_ENABLED) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.AI_TIMEOUT_MS);

    const res = await fetch(CONFIG.CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.85
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Proxy returned ' + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    let text = data.content || "";
    // Convert markdown bold/italic to HTML for cinematic styling
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return text;
  } catch (e) {
    console.warn('AI call failed:', e.message);
    return null;
  }
}

// ============================================================
// Generate a narrative beat (between overs)
// ============================================================
async function generateNarrative(state){
  const textEl = document.getElementById('director-text');
  textEl.innerHTML = '<span class="director-loading"></span> The director is composing...';

  const lastBall = state.ballIdx >= 0 ? ALL_BALLS[state.ballIdx] : null;
  const chapter = Director.computeChapter(state, lastBall);
  const emotion = Director.computeEmotion(state);

  Director.chapter = chapter;
  Director.emotion = emotion;
  document.getElementById('director-chapter').textContent = chapter;
  document.getElementById('director-emotion').textContent = emotion;

  if (CONFIG.AI_ENABLED && lastBall){
    const recentBalls = state.balls.slice(-6).map(b => b.type).join(', ');
    const battingShort = shortTeam(lastBall.battingTeam);
    const userTeam = state.userTeam === 'neutral' ? 'a neutral viewer' : `a ${state.userTeam.toUpperCase()} fan`;
    const score = `${state.inningsScores[lastBall.innings].runs}/${state.inningsScores[lastBall.innings].wkts}`;
    const reactionsCount = Director.userReactions.length;

    const ctx = `Match: ${shortTeam(TEAM2)} vs ${shortTeam(TEAM1)} at ${VENUE.split(',')[0]}.
Innings ${lastBall.innings + 1}, Score: ${battingShort} ${score} after ${lastBall.over}.${lastBall.ball} overs.
Win probability: ${battingShort} at ${Math.round(state.wp)}%.
Last 6 balls: ${recentBalls}.
Viewer is ${userTeam}. They've reacted ${reactionsCount} times this match.
Current phase: ${chapter}. Their emotional state: ${emotion}.`;

    const sys = `You are the MATCH DIRECTOR — a poetic, intimate cricket narrator. You speak DIRECTLY to one viewer, not a crowd. Your job: capture the emotional truth of THIS moment for THIS viewer.

Rules:
- 2 sentences MAXIMUM. Often 1.
- Speak in second person occasionally ("Your captain just...", "You feel it too?").
- Wrap key player names/numbers in <strong> tags. Wrap emotional emphasis in <em> tags.
- NO clichés like "edge of your seat" or "nail-biting".
- NO hashtags, NO emojis.
- Acknowledge their team's perspective without being sycophantic.
- Sound like a film narrator, not ESPN.

Examples of tone:
"Three dots in a row. Bumrah is not letting them breathe. <em>This is the over that decides it.</em>"
"<strong>Patidar</strong> just took down the spinner. Faf would have ordered exactly that shot."
"You picked Siraj. The captain agreed. The wicket came. <em>You're inside their heads tonight.</em>"`;

    const result = await callGPT(sys, ctx, 90);
    if (result){
      textEl.innerHTML = result;
      document.getElementById('director-source').textContent = 'GEMINI';
      return;
    }
  }

  // Fallback
  textEl.innerHTML = Director.fallbackNarrative(state);
  document.getElementById('director-source').textContent = CONFIG.AI_ENABLED ? 'GEMINI·FB' : 'SCRIPTED';
}

// ============================================================
// AI "Ask the Director" handler
// ============================================================
async function askDirector(){
  const input = document.getElementById('ask-input');
  const q = input.value.trim();
  if (!q) return;
  input.value = '';

  appendAskMsg('user', q);
  const placeholder = appendAskMsg('ai', '<span class="director-loading"></span> thinking...');
  Director.userQuestions.push(q);

  if (!CONFIG.AI_ENABLED){
    placeholder.innerHTML = "<em>(AI is offline — paste your Gemini key in js/config.js to enable me.)</em>";
    return;
  }

  const lastBall = state.ballIdx >= 0 ? ALL_BALLS[state.ballIdx] : null;
  const ctx = `Match context: ${shortTeam(TEAM2)} vs ${shortTeam(TEAM1)} at ${VENUE.split(',')[0]}.
Currently: ${lastBall ? `Innings ${lastBall.innings + 1}, ${state.inningsScores[lastBall.innings].runs}/${state.inningsScores[lastBall.innings].wkts} after ${lastBall.over}.${lastBall.ball}` : 'pre-match'}.
Viewer supports: ${state.userTeam === 'neutral' ? 'no team' : state.userTeam.toUpperCase()}.`;

  const sys = `You are the Match Director. You answer cricket questions from a viewer in 2-3 short, vivid sentences. Speak directly, warmly, with personality. Reference current match context when relevant. NO long explanations. NO disclaimers. Wrap key terms in <strong>.`;

  const result = await callGPT(sys, ctx + '\n\nQuestion: ' + q, 130);
  placeholder.innerHTML = result || "<em>Couldn't reach the AI. Try again?</em>";
  document.getElementById('ask-body').scrollTop = document.getElementById('ask-body').scrollHeight;
}

function appendAskMsg(role, text){
  const el = document.createElement('div');
  el.className = 'ask-msg ask-msg-' + role;
  el.innerHTML = text;
  const body = document.getElementById('ask-body');
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
  return el;
}
