/* ============================================================
   PulsePresence — DATA
   Cricsheet parser, sentiment vignettes, captain decisions.
============================================================ */

let MATCH_DATA = null;
let ALL_BALLS = [];
let TEAM1 = '';
let TEAM2 = '';
let VENUE = '';

// Parse Cricsheet JSON into a flat ball-by-ball array
function parseCricsheet(data) {
  const balls = [];
  data.innings.forEach((inn, inningsIdx) => {
    inn.overs.forEach(over => {
      over.deliveries.forEach((d, ballIdx) => {
        const isWicket = !!d.wickets;
        const runs = d.runs.batter;
        let type;
        if (isWicket) type = 'wicket';
        else if (runs === 6) type = 'six';
        else if (runs === 4) type = 'four';
        else if (runs === 0) type = 'dot';
        else if (runs === 1) type = 'one';
        else if (runs === 2) type = 'two';
        else type = 'other';

        balls.push({
          innings: inningsIdx,
          battingTeam: inn.team,
          over: over.over,
          ball: ballIdx + 1,
          batter: d.batter,
          bowler: d.bowler,
          runs: isWicket ? 'W' : runs,
          type,
          wicketKind: isWicket ? d.wickets[0].kind : null,
          playerOut: isWicket ? d.wickets[0].player_out : null
        });
      });
    });
  });
  return balls;
}

// Short team name helper
function shortTeam(fullName) {
  if (!fullName) return '???';
  if (fullName.includes('Royal Challengers')) return 'RCB';
  if (fullName.includes('Chennai Super')) return 'CSK';
  if (fullName.includes('Mumbai Indians')) return 'MI';
  if (fullName.includes('Kolkata Knight')) return 'KKR';
  if (fullName.includes('Rajasthan Royals')) return 'RR';
  if (fullName.includes('Sunrisers')) return 'SRH';
  if (fullName.includes('Delhi')) return 'DC';
  if (fullName.includes('Punjab')) return 'PBKS';
  if (fullName.includes('Gujarat')) return 'GT';
  if (fullName.includes('Lucknow')) return 'LSG';
  return fullName.substring(0, 3).toUpperCase();
}

// Load match data
async function loadMatchData() {
  try {
    const res = await fetch(CONFIG.MATCH_DATA_PATH);
    MATCH_DATA = await res.json();
    ALL_BALLS = parseCricsheet(MATCH_DATA);
    // CSK bats first (toss winner RCB chose to field)
    TEAM1 = MATCH_DATA.info.teams[1]; // CSK
    TEAM2 = MATCH_DATA.info.teams[0]; // RCB
    VENUE = MATCH_DATA.info.venue;
    return true;
  } catch (e) {
    console.error('Failed to load match data:', e);
    return false;
  }
}

// ============================================================
// SENTIMENT — qualitative fan vignettes (NOT chat banter)
// These fire based on match events to show what fans are FEELING
// ============================================================
const SENTIMENT_BY_EVENT = {
  six: [
    "A father in Jayanagar lifts his son onto his shoulders. <em>That six just made the night.</em>",
    "Three friends in a Koramangala flat are screaming at their TV. <strong>The neighbours don't mind — they're screaming too.</strong>",
    "A college student watching alone just punched the air. <em>Nobody saw it. Everyone felt it.</em>",
    "An auto driver parked near MG Road has his phone propped on the dashboard. <strong>He just honked his horn.</strong>",
    "Someone in the stadium is crying. <em>Not sadness. Pure, overwhelming joy.</em>",
    "A grandma in Chennai who said she'd go to bed early is still watching. <strong>That six woke up the whole house.</strong>"
  ],
  four: [
    "A group at a sports bar raises their glasses. <em>Perfectly timed.</em>",
    "Two strangers on the metro just looked at each other and smiled. <strong>Cricket does that.</strong>",
    "The watchman outside a Indiranagar apartment complex just heard the roar from six floors up. <em>He knows.</em>",
    "A delivery rider paused at a traffic light, phone on the handlebar. <em>That boundary made the wait worth it.</em>"
  ],
  wicket: [
    "Silence in one dugout. <strong>Eruption in the other.</strong> That's cricket.",
    "A man in a CSK jersey just went very quiet. His wife knows not to say anything right now.",
    "Somewhere, a fantasy team just collapsed. <em>But this isn't about fantasy. This is about presence.</em>",
    "The bowler's mother is watching from home. <strong>She just called her sister.</strong>",
    "A kid in an RCB jersey is doing a victory dance in the living room. <em>His parents are pretending to be annoyed.</em>"
  ],
  dot: [
    "The pressure builds. <em>You can feel it even through the screen.</em>",
    "A chai wallah near the stadium pauses mid-pour. <strong>Even he's watching now.</strong>",
    "The crowd goes quiet. <em>Sometimes silence is louder than any cheer.</em>"
  ],
  general: [
    "80 million screens. <strong>One heartbeat.</strong>",
    "You're not watching alone. <em>You never were.</em>",
    "This is the moment that will be talked about tomorrow. <strong>You're here for it.</strong>"
  ]
};

// ============================================================
// CAPTAIN DECISIONS — tactical prompts between overs
// Each has a situation, question, options, and the actual answer
// ============================================================
const CAPTAIN_DECISIONS = [
  {
    over: 2,
    situation: "Openers are flying. Rahane just creamed a six off Dayal.",
    question: "What does Faf do?",
    options: [
      "Bring in Siraj — fight fire with pace",
      "Stay with Dayal — back your man",
      "Introduce spin early to break rhythm"
    ],
    actual: 0,
    reveal: "<strong>Faf brought Siraj</strong> from the other end. Aggression met with aggression.",
    fanVote: [52, 31, 17]
  },
  {
    over: 5,
    situation: "Powerplay ending. CSK are 72/1 — Gaikwad is on fire.",
    question: "How does RCB set the field for over 6?",
    options: [
      "Attack — keep slips, go for wickets",
      "Spread the field — contain the damage",
      "Bring in the spinner to slow things down"
    ],
    actual: 2,
    reveal: "<strong>Karn Sharma</strong> was introduced. Spin in the powerplay — a bold tactical move.",
    fanVote: [28, 38, 34]
  },
  {
    over: 8,
    situation: "Gaikwad has passed 50. Dube joins him. CSK accelerating.",
    question: "Who bowls the crucial 9th over?",
    options: [
      "Maxwell — part-time spin gamble",
      "Siraj — bring back the main weapon",
      "Ferguson — raw express pace"
    ],
    actual: 0,
    reveal: "Faf went with <strong>Maxwell</strong>. The gamble? Dube smashed him for a six. <em>Captaincy is about conviction, not outcomes.</em>",
    fanVote: [22, 45, 33]
  },
  {
    over: 11,
    situation: "Dhoni walks in. The stadium erupts. 147/3.",
    question: "What does Faf do when Dhoni arrives?",
    options: [
      "Bowl pace — test his reflexes early",
      "Go with spin — slow it down, make him work",
      "Set a deep field — respect the legend"
    ],
    actual: 1,
    reveal: "<strong>Karn Sharma continued.</strong> Dhoni smashed him for a six first ball. <em>Some legends refuse to be contained.</em>",
    fanVote: [35, 30, 35]
  },
  {
    over: 13,
    situation: "Death overs approaching. Gaikwad still there. CSK eyeing 200+.",
    question: "Who gets the ball for the critical 14th over?",
    options: [
      "Ferguson — pace to unsettle",
      "Siraj — experience under pressure",
      "Dayal — left-arm variation"
    ],
    actual: 0,
    reveal: "<strong>Lockie Ferguson got the call.</strong> Express pace in the death — and Gaikwad fell trying to force the issue.",
    fanVote: [40, 38, 22]
  }
];
