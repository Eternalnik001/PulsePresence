/* ============================================================
   PulsePresence — CO-CAPTAIN MODE
   Tactical decisions BEFORE the captain makes them.
   NO scoring. NO XP. Just "make the call."
============================================================ */

const Captain = {
  currentDecision: null,
  shown: new Set(),
  picked: false,

  // Check if we should show a captain prompt at this over boundary
  shouldShow(overNum) {
    const decision = CAPTAIN_DECISIONS.find(d => d.over === overNum && !this.shown.has(d.over));
    return decision || null;
  },

  // Render the decision card
  show(decision) {
    this.currentDecision = decision;
    this.picked = false;
    this.shown.add(decision.over);

    const card = document.getElementById('captain-card');
    const status = document.getElementById('captain-status');
    status.textContent = 'YOUR CALL';

    card.innerHTML = `
      <div class="captain-prompt">
        <div class="captain-situation">${decision.situation}</div>
        <div class="captain-question">${decision.question}</div>
      </div>
      <div class="captain-options" id="captain-options">
        ${decision.options.map((opt, i) => `
          <button class="captain-opt" data-idx="${i}" onclick="Captain.pick(${i})">${opt}</button>
        `).join('')}
      </div>
    `;
  },

  // User picks an option
  pick(idx) {
    if (this.picked) return;
    this.picked = true;
    const decision = this.currentDecision;
    const opts = document.querySelectorAll('.captain-opt');

    opts.forEach((el, i) => {
      el.style.pointerEvents = 'none';
      if (i === idx) el.classList.add('selected');
    });

    // Reveal after a beat
    setTimeout(() => {
      opts.forEach((el, i) => {
        el.classList.remove('selected');
        if (i === decision.actual) el.classList.add('correct');
        else el.classList.add('wrong');
      });

      // Show reveal text + fan vote
      const card = document.getElementById('captain-card');
      const voteBar = decision.fanVote.map((pct, i) => {
        const colors = ['#ff9d2e', '#8a8278', '#4a4540'];
        return `<span style="display:inline-block;width:${pct}%;height:4px;background:${colors[i]};border-radius:2px" title="${pct}%"></span>`;
      }).join('');

      const revealDiv = document.createElement('div');
      revealDiv.className = 'captain-reveal';
      revealDiv.innerHTML = `
        ${decision.reveal}<br/><br/>
        <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;color:var(--ink-faint)">FAN VOTE</span><br/>
        <div style="display:flex;gap:1px;margin-top:4px;border-radius:2px;overflow:hidden">${voteBar}</div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:9px;color:var(--ink-faint);font-family:var(--font-mono)">
          ${decision.options.map((o, i) => `<span>${decision.fanVote[i]}%</span>`).join('')}
        </div>
      `;
      card.appendChild(revealDiv);

      document.getElementById('captain-status').textContent = 'REVEALED';

      // Track for director context
      Director.userPicks.push({ over: decision.over, pick: idx, actual: decision.actual });
    }, 800);
  },

  // Reset to standby
  reset() {
    const card = document.getElementById('captain-card');
    card.innerHTML = `
      <div class="captain-empty">
        <div class="captain-empty-icon">▲</div>
        <div class="captain-empty-text">Tactical decisions appear between overs. Make your call before the captain does.</div>
      </div>
    `;
    document.getElementById('captain-status').textContent = 'STANDBY';
    this.currentDecision = null;
  }
};
