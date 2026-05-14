/* ============================================================
   PulsePresence — STADIUM WAVE
   Hold-to-join orb mechanic. Synchronized presence.
============================================================ */

const Wave = {
  active: false,
  holding: false,
  participation: 0,   // 0-100
  baseline: 0,        // simulated other users
  holdInterval: null,
  decayInterval: null,
  triggered: false,

  init() {
    const orb = document.getElementById('wave-orb');
    
    // Mouse events
    orb.addEventListener('mousedown', (e) => { e.preventDefault(); this.startHold(); });
    document.addEventListener('mouseup', () => this.stopHold());
    
    // Touch events
    orb.addEventListener('touchstart', (e) => { e.preventDefault(); this.startHold(); }, { passive: false });
    document.addEventListener('touchend', () => this.stopHold());

    // Ambient participation decay
    this.decayInterval = setInterval(() => {
      if (!this.holding && this.baseline > 0) {
        this.baseline = Math.max(0, this.baseline - 0.3);
        this.updateUI();
      }
    }, 200);
  },

  // Activate the wave (called on big moments)
  activate() {
    this.active = true;
    this.triggered = false;
    this.baseline = 15 + Math.random() * 20; // 15-35% already "holding"
    document.getElementById('wave-status').textContent = 'ACTIVE';
    document.getElementById('wave-prompt').innerHTML = 
      '<strong style="color:var(--amber)">A moment is building.</strong> Hold the orb to join the wave.<br/>' +
      '<span class="wave-prompt-sub">Synchronized with everyone watching.</span>';
    this.updateUI();
  },

  startHold() {
    if (!this.active) return;
    this.holding = true;
    document.getElementById('wave-orb').classList.add('holding');
    document.getElementById('wave-orb-text').textContent = '···';

    // Haptic
    if (navigator.vibrate) navigator.vibrate(30);

    this.holdInterval = setInterval(() => {
      // User holding adds participation
      this.baseline = Math.min(100, this.baseline + 1.5 + Math.random() * 2);
      
      // Simulate other users joining when momentum builds
      if (this.baseline > 30) {
        this.baseline = Math.min(100, this.baseline + Math.random() * 1.5);
      }

      this.updateUI();

      // Check threshold
      if (this.baseline >= 50 && !this.triggered) {
        this.triggerWave();
      }
    }, 100);
  },

  stopHold() {
    this.holding = false;
    document.getElementById('wave-orb').classList.remove('holding');
    document.getElementById('wave-orb-text').textContent = 'HOLD';
    if (this.holdInterval) {
      clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
  },

  triggerWave() {
    this.triggered = true;
    
    // Haptic burst
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

    // Screen ripple
    const ripple = document.createElement('div');
    ripple.className = 'wave-ripple';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1500);

    // Toast
    showToast(`🌊 ${(Math.floor(Math.random() * 400) + 200)}K phones pulsing together`);

    // Update status
    document.getElementById('wave-status').textContent = 'WAVE!';
    document.getElementById('wave-prompt').innerHTML = 
      '<strong style="color:var(--amber)">The wave rippled across all viewers.</strong><br/>' +
      '<span class="wave-prompt-sub">You were part of something synchronized.</span>';

    // Slowly decay after wave
    setTimeout(() => {
      this.active = false;
      this.baseline = 0;
      this.updateUI();
      document.getElementById('wave-status').textContent = 'DORMANT';
      document.getElementById('wave-prompt').innerHTML = 
        'When a big moment hits, hold to join the wave.<br/>' +
        '<span class="wave-prompt-sub">Synchronized with everyone watching.</span>';
    }, 5000);
  },

  updateUI() {
    const pct = Math.min(100, Math.round(this.baseline));
    document.getElementById('wave-fill').style.width = pct + '%';
    const count = Math.floor(pct * 8472); // simulate crowd size
    document.getElementById('wave-count').textContent = count.toLocaleString();
  },

  // Called by engine on big moments
  onBigMoment() {
    if (!this.active && !this.triggered) {
      this.activate();
    }
  }
};
