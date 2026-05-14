/* ============================================================
   PulsePresence — KEY MOMENT THEATRE
   Full-screen overlay on six/wicket events.
============================================================ */

const Theatre = {
  open: false,

  // Fire the theatre overlay for a big moment
  async show(ball, state) {
    if (this.open) return;
    this.open = true;

    const el = document.getElementById('theatre');
    const headline = document.getElementById('theatre-headline');
    const subhead = document.getElementById('theatre-subhead');
    const context = document.getElementById('theatre-context');
    const tag = document.getElementById('theatre-tag');
    const collectiveBar = document.getElementById('theatre-collective-bar');

    // Remove old type classes
    el.classList.remove('six', 'four', 'wicket');

    if (ball.type === 'six') {
      el.classList.add('six');
      tag.textContent = 'KEY MOMENT';
      headline.textContent = 'SIX!';
      subhead.textContent = `${ball.batter} launches ${ball.bowler}`;
    } else if (ball.type === 'wicket') {
      el.classList.add('wicket');
      tag.textContent = 'WICKET';
      headline.textContent = 'OUT!';
      subhead.textContent = `${ball.playerOut} — ${ball.wicketKind}`;
    } else if (ball.type === 'four') {
      el.classList.add('four');
      tag.textContent = 'BOUNDARY';
      headline.textContent = 'FOUR!';
      subhead.textContent = `${ball.batter} finds the gap off ${ball.bowler}`;
    }

    // Generate collective sentiment bar (simulated)
    const emojis = ['🔥', '🤯', '👏', '💔', '🙏'];
    const weights = ball.type === 'wicket'
      ? [15, 20, 25, 30, 10]
      : [35, 25, 25, 5, 10];
    const colors = ['#ff9d2e', '#a855f7', '#fbbf24', '#ef4444', '#10b981'];

    collectiveBar.innerHTML = weights.map((w, i) =>
      `<div class="theatre-collective-segment" style="width:${w}%;background:${colors[i]}" title="${emojis[i]} ${w}%"></div>`
    ).join('');

    // Reset reaction buttons
    document.querySelectorAll('.theatre-react').forEach(btn => btn.classList.remove('picked'));

    // Show overlay
    context.innerHTML = '<span class="director-loading"></span> AI is analyzing this moment...';
    el.classList.add('show');

    // Generate AI context
    if (CONFIG.AI_ENABLED) {
      const score = `${state.inningsScores[ball.innings].runs}/${state.inningsScores[ball.innings].wkts}`;
      const battingShort = shortTeam(ball.battingTeam);
      const userTeam = state.userTeam === 'neutral' ? 'neutral viewer' : state.userTeam.toUpperCase() + ' fan';

      const sys = `You generate a 1-2 sentence dramatic context for a cricket moment. Speak like a film narrator. Use <strong> for key names/stats. Use <em> for emotional emphasis. NO clichés. NO hashtags.`;
      const prompt = `${ball.type === 'wicket' ? 'WICKET' : ball.type.toUpperCase()}: ${ball.batter} ${ball.type === 'wicket' ? 'is out (' + ball.wicketKind + ')' : 'hits a ' + ball.type} off ${ball.bowler}. Score: ${battingShort} ${score} in over ${ball.over}.${ball.ball}. The viewer is a ${userTeam}. Why does THIS moment matter?`;

      const result = await callGPT(sys, prompt, 80);
      if (result) {
        context.innerHTML = result;
      } else {
        context.innerHTML = this.fallbackContext(ball, state);
      }
    } else {
      context.innerHTML = this.fallbackContext(ball, state);
    }
  },

  fallbackContext(ball, state) {
    const score = `${state.inningsScores[ball.innings].runs}/${state.inningsScores[ball.innings].wkts}`;
    if (ball.type === 'six') {
      return `<strong>${ball.batter}</strong> sends it into the stands. ${shortTeam(ball.battingTeam)} at <strong>${score}</strong>. <em>The crowd erupts.</em>`;
    } else if (ball.type === 'wicket') {
      return `<strong>${ball.playerOut}</strong> has to walk back. ${ball.wicketKind}. <em>That changes everything.</em>`;
    } else {
      return `<strong>${ball.batter}</strong> finds the boundary. ${shortTeam(ball.battingTeam)} pushing at <strong>${score}</strong>.`;
    }
  }
};

// Close theatre
function closeTheatre() {
  document.getElementById('theatre').classList.remove('show');
  Theatre.open = false;
}

// Theatre reaction buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.theatre-react').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.add('picked');
      const emoji = btn.dataset.emoji;
      Director.userReactions.push({ ballIdx: state?.ballIdx || 0, emoji });

      // Floating emoji
      const float = document.createElement('div');
      float.className = 'floating-emoji';
      float.textContent = emoji;
      float.style.left = (btn.getBoundingClientRect().left + 10) + 'px';
      float.style.top = (btn.getBoundingClientRect().top) + 'px';
      document.body.appendChild(float);
      setTimeout(() => float.remove(), 2000);
    });
  });
});
