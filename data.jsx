/* ============================================================
   BeTon — data model + sample data generator (deterministic)
   ============================================================ */

const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio'];

const DAILY_COFFEE_TARGET = 3;
const WEEKLY_COFFEE_QUOTA = 15;

const CONTEST = {
  weeks: 15,
  weeklyGym: 4,
  weeklyCal: 14000,
  cheatTotal: 10,
  finish: '2026-09-26',
  currentWeek: 5,
  today: '2026-07-16',          // Thursday of week 5
  todayIdx: 3,                  // 0=Mon ... within week 5, Mon/Tue/Wed logged
};

const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MS_DAY = 86400000;
const START = Date.UTC(2026, 5, 15);                  // Mon 15 Jun 2026 — week 1 day 1

function iso(ts) { return new Date(ts).toISOString().slice(0, 10); }
function weekDates(w) {                                // w: 1..15
  const s = START + (w - 1) * 7 * MS_DAY;
  return Array.from({ length: 7 }, (_, i) => iso(s + i * MS_DAY));
}
function fmtDate(isoStr) {
  const d = new Date(isoStr + 'T00:00:00Z');
  return { dow: DOW[(d.getUTCDay() + 6) % 7], d: d.getUTCDate(), mon: MON[d.getUTCMonth()] };
}
function daysBetween(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / MS_DAY);
}

// seeded RNG (mulberry32)
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// session templates (push/pull/legs rotation)
const SESSIONS = [
  ['Chest', 'Triceps', 'Shoulders'],
  ['Back', 'Biceps'],
  ['Legs', 'Abs'],
  ['Chest', 'Back'],
  ['Cardio', 'Abs'],
  ['Shoulders', 'Biceps', 'Triceps'],
  ['Legs', 'Cardio'],
];

/* Weekly plan per player. gym = sessions, cal = week total kcal,
   gd = gym day indices, cheat = cheat-meal day indices.
   Designed so series after 4 weeks is 2–2 (neck and neck). */
const PLAN = {
  Csongor: [
    { gym: 4, cal: 13500, gd: [0, 1, 3, 5], cheat: [6] },     // W1  2pts  WIN
    { gym: 4, cal: 14600, gd: [0, 2, 3, 5], cheat: [5] },     // W2  1pt   loss (cal over)
    { gym: 5, cal: 13200, gd: [0, 1, 2, 4, 5], cheat: [] },   // W3  2pts  WIN
    { gym: 3, cal: 14450, gd: [1, 3, 5], cheat: [4] },        // W4  0pts  loss
    { gym: 2, cal: 5650, gd: [0, 2], cheat: [], partial: 3 }, // W5  live (Mon-Wed)
  ],
  Peter: [
    { gym: 3, cal: 13800, gd: [0, 2, 4], cheat: [5] },        // W1  1pt   loss
    { gym: 5, cal: 13900, gd: [0, 1, 3, 4, 6], cheat: [] },   // W2  2pts  WIN
    { gym: 4, cal: 14300, gd: [0, 1, 3, 5], cheat: [6] },     // W3  1pt   loss (cal over)
    { gym: 4, cal: 13600, gd: [0, 2, 4, 5], cheat: [4, 5] },  // W4  2pts  WIN
    { gym: 2, cal: 6050, gd: [1, 2], cheat: [0], partial: 3 },// W5  live (Mon-Wed)
  ],
};

const PLAYERS = ['Csongor', 'Peter'];
const COLOR = { Csongor: 'blue', Peter: 'red' };

function buildDays(player) {
  const plan = PLAN[player];
  const days = {};
  let cheatRunning = 0;
  plan.forEach((wk, wi) => {
    const dates = weekDates(wi + 1);
    const limit = wk.partial != null ? wk.partial : 7;
    const r = rng((player.charCodeAt(0) * 131 + wi * 977) >>> 0);
    // distribute calories across logged days with variance, hit exact total
    const raw = [];
    for (let i = 0; i < limit; i++) {
      let base = 0.85 + r() * 0.3;
      if (wk.cheat.includes(i)) base += 0.35;
      raw.push(base);
    }
    const sum = raw.reduce((a, b) => a + b, 0);
    let allocated = 0;
    for (let i = 0; i < limit; i++) {
      const date = dates[i];
      let cals = Math.round((raw[i] / sum) * wk.cal / 10) * 10;
      if (i === limit - 1 && wk.partial == null) cals = wk.cal - allocated; // exact close
      allocated += cals;
      const isGym = wk.gd.includes(i);
      const isCheat = wk.cheat.includes(i);
      if (isCheat) cheatRunning++;
      const muscles = isGym ? SESSIONS[(wi * 2 + wk.gd.indexOf(i)) % SESSIONS.length] : [];
      // protein: higher on gym days
      const protein = 0;
      let junk = 0;
      let coffees = Math.min(4, Math.round(r() * 4));
      if (isCheat) junk = 950 + Math.round(r() * 650);
      else if (r() > 0.62) junk = Math.round(r() * 420 / 10) * 10;
      days[date] = {
        cals, protein, junk, coffees,
        gym: isGym, muscles: muscles.slice(),
        cheat: isCheat,
        cheatNo: isCheat ? cheatRunning : null,
      };
    }
  });
  return days;
}

function makeInitialState() {
  const days = {};
  PLAYERS.forEach(p => { days[p] = buildDays(p); });
  return {
    theme: 'dark',
    // calorie goal as an effective-dated timeline: applies from `from` forward
    // until the next entry. Changing the goal never rewrites past days.
    goals: {
      Csongor: [{ from: weekDates(1)[0], value: 2000 }, { from: weekDates(3)[0], value: 2100 }],
      Peter: [{ from: weekDates(1)[0], value: 2000 }, { from: weekDates(4)[0], value: 1950 }],
    },
    days,
  };
}

/* ---------- derived selectors ---------- */
function weekSummary(state, player, w) {
  const dates = weekDates(w);
  let cals = 0, coffees = 0, gym = 0, logged = 0, cheats = 0;
  dates.forEach(dt => {
    const d = state.days[player][dt];
    if (!d) return;
    logged++;
    cals += d.cals;
    coffees += d.coffees || 0;
    if (d.gym) gym++;
    if (d.cheat) cheats++;
  });
  const gymHit = gym >= CONTEST.weeklyGym;
  const calHit = logged === 7 ? cals <= CONTEST.weeklyCal : true;
  const pts = (gym >= CONTEST.weeklyGym ? 1 : 0) + (logged === 7 && cals <= CONTEST.weeklyCal ? 1 : 0);
  return {
    cals, coffees, gym, logged, cheats,
    gymHit, calHit, pts,
    complete: logged === 7,
  };
}

function weekResult(state, w) {
  const c = weekSummary(state, 'Csongor', w);
  const p = weekSummary(state, 'Peter', w);
  let winner = 'tie';
  if (c.complete && p.complete) {
    if (c.pts > p.pts) winner = 'Csongor';
    else if (p.pts > c.pts) winner = 'Peter';
    else winner = c.cals <= p.cals ? 'Csongor' : 'Peter'; // tiebreak: lower calories
  }
  return { c, p, winner };
}

function series(state) {
  let cw = 0, pw = 0;
  for (let w = 1; w < CONTEST.currentWeek; w++) {
    const r = weekResult(state, w);
    if (r.winner === 'Csongor') cw++;
    else if (r.winner === 'Peter') pw++;
  }
  return { Csongor: cw, Peter: pw };
}

function cheatsUsed(state, player) {
  let n = 0;
  Object.values(state.days[player]).forEach(d => { if (d.cheat) n++; });
  return n;
}

function daysLeft(state) { return daysBetween(CONTEST.today, CONTEST.finish); }

/* effective-dated calorie goal: returns the goal in force on `date` */
function goalFor(goals, player, date) {
  const list = goals[player];
  let val = list[0].value;
  for (let i = 0; i < list.length; i++) {
    if (list[i].from <= date) val = list[i].value; else break;
  }
  return val;
}
function currentGoal(goals, player) { return goalFor(goals, player, CONTEST.today); }

/* upsert a goal effective from `date` (default today) forward */
function setGoalFrom(goals, player, value, date) {
  value = Math.max(1000, value);
  date = date || CONTEST.today;
  const list = goals[player].slice();
  const idx = list.findIndex(g => g.from === date);
  if (idx >= 0) list[idx] = { from: date, value };
  else list.push({ from: date, value });
  list.sort((a, b) => (a.from < b.from ? -1 : 1));
  return { ...goals, [player]: list };
}

Object.assign(window, {
  MUSCLES, CONTEST, PLAYERS, COLOR, weekDates, fmtDate, daysBetween,
  makeInitialState, weekSummary, weekResult, series, cheatsUsed, daysLeft,
  goalFor, currentGoal, setGoalFrom,
});
