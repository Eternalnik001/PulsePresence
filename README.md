# 🏏 PulsePresence

**A second-screen experience for live cricket. Don't watch the match — be inside it.**

> *Designed for Google Cloud Build with AI · Agentic Premier League — 1st Innings Challenge*

---

## 🎯 The Brief

> *"Design a system that enhances how users experience live sporting events beyond passive viewing. The solution should create meaningful second-screen interactions during matches, enabling fans to engage with key moments, participate in real-time activities, and feel more connected to the game as it unfolds."*

Our reading: **This is not a gamification problem.** It's a *presence* problem. How do you make 80 million people watching alone feel like 80 million people watching together?

**PulsePresence answers with four pillars** — none of them XP, points, or leaderboards.

---

## 🎨 The Four Pillars

### 1. **AI Match Director** *(personalized live narrative)*
Powered by **GPT-4o-mini**. The Director knows which team you support, which moments you reacted to, what you've asked about. Every over, it whispers a 1-2 sentence narrative beat — like a film narrator inside your headphones.

> *"You picked Siraj. The captain agreed. The wicket came. You're inside their heads tonight."*

Match phase tracking: **PROLOGUE → POWERPLAY → MIDDLE OVERS → DEATH OVERS → EPILOGUE**.
Emotional arc tracking: **ANTICIPATION → HOPEFUL → TENSE → EUPHORIC**.

### 2. **Co-Captain Mode** *(tactical participation, not prediction)*
Between overs, a tactical question appears: *"Dhoni walks in. What does Faf do?"* You vote on bowler change, field setting, or batting approach **before the captain acts**. Then the real decision is revealed, alongside what the crowd voted for.

It's not "predict the runs" (that's gambling). It's **"make the call before the captain does"** (that's co-captaincy).

### 3. **Stadium Wave** *(synchronized real-time participation)*
**Hold the orb.** Others are holding too. When 50%+ hold together, a wave **ripples across all viewers' phones simultaneously** — coordinated haptic burst, screen ripple, toast notification of "412K phones pulsing."

This is the closest thing to *being in the stadium* that a phone can do.

### 4. **Key Moment Theatre** *(automatic cinematic transformation)*
When a six is hit or a wicket falls, **the screen auto-transforms**. A full-screen overlay appears with:
- Giant headline (SIX! / OUT!)
- AI-generated context about *why this moment matters*
- 5 reaction emojis to share your feeling
- A collective sentiment bar showing what 2.4M other fans felt

Not a notification you can ignore. A moment you're *placed inside*.

### Plus: **Collective Pulse** *(4-dimensional emotion meter)*
Real-time visualization of what the global audience is feeling — **Joy / Tension / Hope / Disbelief** — animated as four parallel bars, with a pulsing globe core. The map of 80 million hearts in one view.

### And: **Ask the Director** *(GPT chat with full match context)*
"Why did he change the field?" "What's at stake here?" — GPT answers using the live match state, your team affiliation, and recent ball events.

---

## 🚫 What This is NOT

| ❌ This is not... | ✅ This is... |
|---|---|
| Fantasy cricket (Dream11) | A live emotional layer |
| A prediction-and-XP game | A presence and tactical engine |
| A score notification app | An adaptive narrative experience |
| Generic emoji reactions | Curated moments with AI context |
| A leaderboard | An intimacy generator |

**Zero points. Zero streaks. Zero leaderboards. By design.**

---

## 🚀 Setup (3 steps)

### 1. Paste your OpenAI key
Open `js/config.js`, line 11:
```js
OPENAI_API_KEY: "sk-proj-YOUR_KEY_HERE",
```

### 2. Test locally
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

### 3. Deploy

**GitHub Pages (free):**
```bash
git init && git add . && git commit -m "PulsePresence"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pulsepresence.git
git push -u origin main
```
Then: **Repo → Settings → Pages → Source: GitHub Actions**

**Google Cloud Storage ($5 credit lasts months):**
```bash
gcloud storage buckets create gs://pulsepresence --location=asia-south1
gcloud storage cp -r . gs://pulsepresence/
gcloud storage buckets update gs://pulsepresence --web-main-page-suffix=index.html
gcloud storage buckets add-iam-policy-binding gs://pulsepresence \
  --member=allUsers --role=roles/storage.objectViewer
```

---

## 🎬 Demo Flow (60 seconds)

1. Open URL → **cinematic intro card** sells the vision
2. **Pick your team** (RCB / CSK / Neutral) → unlocks the CTA
3. Click "**Enter the Stadium**" → match begins
4. **Match Director** narrates the opening: *"Two histories, one night."*
5. First ball is bowled → presence pulse updates emotion bars
6. **Six!** → Theatre overlay erupts with AI context + reactions
7. Between overs → **Co-Captain prompt** appears: *"What's your call?"*
8. **Hold the wave orb** → counter climbs → ripples fire across screen
9. **Ask the Director** anything → GPT answers in match context
10. Bump speed to **8x** → drama in fast-forward

The judges feel: *intimate, cinematic, presence — not a game*.

---

## 📂 Project Structure

```
pulsepresence/
├── index.html            ← HTML shell
├── css/
│   └── styles.css        ← Cinematic broadcast aesthetic
├── js/
│   ├── config.js         ← 🔑 YOU EDIT THIS (API key)
│   ├── data.js           ← Match parsing + sentiment/captain content
│   ├── director.js       ← AI Match Director (GPT)
│   ├── captain.js        ← Co-Captain decisions
│   ├── wave.js           ← Stadium Wave mechanic
│   ├── theatre.js        ← Key Moment overlay
│   ├── engine.js         ← Match loop + presence model
│   └── app.js            ← Main entry point
├── data/
│   └── match.json        ← Real Cricsheet ball-by-ball data
└── README.md
```

---

## 🛠️ Tech Stack

- **Pure HTML/CSS/JS** — no framework, no build, runs anywhere
- **OpenAI GPT-4o-mini** — Match Director + Ask + Key Moment context
- **Cricsheet JSON** — real IPL ball-by-ball (RCB vs CSK 2024)
- **Fonts:** Bebas Neue · Playfair Display · Inter · Space Mono
- **Hosting:** GitHub Pages or GCP Cloud Storage
- **No backend required** for demo. Adds ~₹1-3 per full match in GPT cost.

---

## 💰 Cost at Demo Scale

- GitHub Pages: **₹0**
- Cricsheet data: **₹0** (open source)
- GCP Cloud Storage: **~₹5/month** at trickle traffic
- OpenAI per demo session: **~₹1-3** with gpt-4o-mini
- **Total:** **~₹3 for the whole competition.**

---

## 🏗️ Production Architecture (Roadmap)

```
                    IPL Data Feed (Opta / Sportradar)
                              │
                              ▼
                  Cloud Pub/Sub: match-events
                              │
                ┌─────────────┴────────────────┐
                ▼                              ▼
        Event Processor              Vertex AI (Gemini 2.5)
        (Cloud Run)                  - Match Director narrative
                                     - Co-Captain decision context
                                     - Win probability + emotion
                ▼                              ▼
        ┌─────────────────────────────────────────┐
        │   Memorystore (Redis): live match state │
        └─────────────────────────────────────────┘
                              │
                              ▼
                  WebSocket Gateway (GKE Autopilot)
                              │
                              ▼
              Clients (Flutter mobile + web + smart TV)
```

**Stadium Wave at scale:** Use Redis INCR for participation count, BroadcastChannel for sync, Cloud CDN for the ripple animation assets. Threshold trigger is a Redis pub/sub event that fan-outs to all WebSocket connections.

**Synchronized broadcast delay handling:** Each client calibrates its broadcast delay on join (audio fingerprint of crowd noise vs reference). Theatre overlays trigger on `event_time_at_stadium + user_delay_offset`. This means a TV viewer in Bangalore and a JioCinema viewer in Delhi see the Theatre overlay at the *same moment* relative to *their* stream.

---

## 🎯 Why This Wins Challenge 1

| Challenge requirement | How PulsePresence solves it |
|---|---|
| "Beyond passive viewing" | Auto-transforming Theatre on every key moment |
| "Meaningful second-screen interactions" | 4 distinct interaction modes, all match-tied |
| "Engage with key moments" | Theatre overlay + AI context + collective reactions |
| "Participate in real-time activities" | Co-Captain decisions + Stadium Wave |
| "Feel more connected to the game" | Personalized AI Match Director, knows YOU |
| "As it unfolds" | All four pillars triggered by live match state |

Every feature traces back to a clause in the brief. Nothing is decoration.

---

*Don't watch the match. Be inside it.*

**PulsePresence**
