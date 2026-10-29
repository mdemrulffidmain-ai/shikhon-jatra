// শেখার ইঞ্জিন: ভুলের খাতা, দৈনিক তিন কাজ, ধাপ-উপাধি, ব্যাজ, ঝটপট ছক, মিশন, স্তর খোঁজা।
// জাপান ও চীনের শেখার পদ্ধতির যে অংশগুলো এখানে সত্যিই আছে: দক্ষতা-ভিত্তিক পাস (৮০%), বিরতি দিয়ে পুনরাবৃত্তি,
// ঝটপট ছক (百マス計算) ও নামতার ছন্দ, ভুলের খাতা (ミスノート), বেল্টের মতো ধাপ-উপাধি, সোরোবান-অ্যাবাকাসের ছবি, বাস্তব→ছবি→সংখ্যা ক্রমে গণিত।
import { S, save, passedCount, streak, dayNum, totalStars, topicDone, level, ageBand, dueIds } from './state.js';
import { bd, rnd, shuffle, localDate } from './util.js';
import { MISSIONS, TOPICS } from '../data/index.js';
import { mulFactQ, MATH_GEN as MG0 } from '../data/mathpath.js';
import { HIGH_GEN } from '../data/mathhigh.js';
const MATH_GEN = { ...MG0, ...HIGH_GEN };
import { vocabById } from '../data/english.js';
import { buildQuestions } from '../data/topics.js';

// ---------- ভুলের খাতা ----------
const key = (p, ans) => { let h = 5381; const s = p + '|' + ans; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'm' + (h >>> 0).toString(36); };
export function addMistake(q) {
  if (q.show || !q.opts) return; // ছবি বা কোড ছাড়া শুধু লেখার প্রশ্ন খাতায় ওঠে
  const right = q.opts.find((o) => o.v === q.ans);
  if (!right) return;
  const k = key(q.p, right.h);
  const old = S.mistakes.find((m) => m.k === k);
  if (old) { old.ok = 0; old.t = Date.now(); } else S.mistakes.unshift({ k, p: String(q.p).slice(0, 300), o: q.opts.map((o) => String(o.h).slice(0, 80)), a: q.opts.indexOf(right), why: String(q.why || '').slice(0, 300), ok: 0, t: Date.now() });
  S.mistakes = S.mistakes.slice(0, 40);
}
export function mistakeQuestions(n = 5) {
  return shuffle(S.mistakes).slice(0, n).map((m) => ({ id: 'mk:' + m.k, p: m.p, opts: m.o.map((h, v) => ({ v, h })), ans: m.a, why: m.why, mk: m.k }));
}
export function mistakeResult(k, ok) {
  const m = S.mistakes.find((x) => x.k === k);
  if (!m) return;
  if (ok) { m.ok++; if (m.ok >= 2) S.mistakes = S.mistakes.filter((x) => x.k !== k); } else m.ok = 0;
}

// ---------- পুনরাবৃত্তির প্রশ্ন (নামতা ও English শব্দ) ----------
export function reviewQuestions(n = 8) {
  const out = [];
  for (const id of dueIds(n)) {
    let r = null;
    if (id.startsWith('x|')) { const [, a, b] = id.split('|'); r = mulFactQ(+a, +b); } else if (id.startsWith('v|')) r = vocabById(id);
    if (!r) continue;
    const idx = shuffle(r.o.map((_, k) => k));
    out.push({ id, p: r.p, opts: idx.map((k, v) => ({ v, h: r.o[k] })), ans: idx.indexOf(r.a), why: r.why, say: r.say, lang: r.lang });
  }
  return out;
}

// ---------- মিশ্র অভ্যাস (interleaving) ----------
// শেষ করা স্তরগুলো থেকে একটি করে প্রশ্ন, প্রতিবার ভিন্ন বিষয়ে। একই ধরনের প্রশ্ন পরপর করার চেয়ে মিশিয়ে অনুশীলন করলে
// কোন নিয়ম কখন লাগে তা বোঝার ক্ষমতা বাড়ে (গবেষণায় এটি পরিচিত: interleaved practice)।
export const MIX_WORLDS = ['mh', 'sp', 'ee', 'bl', 'cr', 'cd'];
export function mixedPool() { return MIX_WORLDS.flatMap((w) => (TOPICS[w] || []).filter((t) => topicDone(t.id))); }
export function mixedQuestions(n = 10) {
  const pool = shuffle(mixedPool());
  const picks = [];
  for (let i = 0; picks.length < n && pool.length; i++) {
    const t = pool[i % pool.length];
    if (picks.length && pool.length > 1 && picks[picks.length - 1] === t) continue;
    picks.push(t);
  }
  return picks.map((t, i) => {
    const qs = buildQuestions(t), q = qs[rnd(qs.length)];
    return { id: `mx:${t.id}:${i}`, sk: q.sk, p: q.p, opts: q.o.map((h, v) => ({ v, h })), ans: q.a, why: q.why, show: q.show, say: q.say, lang: q.lang };
  });
}

// ---------- দৈনিক কাজ ----------
export const QUESTS = [
  { id: 'pass', t: 'একটি পাঠ বা পরীক্ষায় পাস', need: 1 },
  { id: 'grid', t: 'একবার ঝটপট ছক', need: 1 },
  { id: 'review', t: 'পুনরাবৃত্তি বা অনুশীলন', need: 1 },
  { id: 'mistake', t: 'ভুলের খাতার একটি প্রশ্ন ঠিক', need: 1 }
];
const today = () => S.quests[localDate()] || (S.quests[localDate()] = {});
export function bump(id, n = 1) { const q = today(); q[id] = (q[id] || 0) + n; Object.keys(S.quests).forEach((d) => { if (d < localDate(new Date(Date.now() - 20 * 864e5))) delete S.quests[d]; }); save(); }
// প্রতিদিন তিনটি: "পাস" সবসময়, আরও দুটি দিনের সংখ্যা অনুযায়ী ঘুরে
export function todayQuests() {
  const d = dayNum(), rest = ['grid', 'review', 'mistake'];
  const pick = [rest[d % 3], rest[(d + 1) % 3]];
  const q = today();
  return ['pass', ...pick].map((id) => { const def = QUESTS.find((x) => x.id === id); return { ...def, have: q[id] || 0, done: (q[id] || 0) >= def.need }; });
}
export function questBonus() { // তিনটি শেষ হলে একবার ১০০ ... নয়, ২০ অভিজ্ঞতা
  const q = today();
  if (q.bonus || !todayQuests().every((x) => x.done)) return 0;
  q.bonus = 1; S.xp += 20; save(); return 20;
}

// ---------- ধাপ-উপাধি (জাপানি কিউ-দান বেল্টের অনুকরণ) ----------
export const RANKS = [
  { lv: 1, n: '১০ কিউ', c: 'সাদা', col: '#f2f2f2' }, { lv: 3, n: '৯ কিউ', c: 'হলুদ', col: '#ffd54a' }, { lv: 5, n: '৮ কিউ', c: 'কমলা', col: '#ff9a3c' },
  { lv: 8, n: '৭ কিউ', c: 'সবুজ', col: '#4cc36b' }, { lv: 11, n: '৬ কিউ', c: 'নীল', col: '#4a8cff' }, { lv: 15, n: '৫ কিউ', c: 'বেগুনি', col: '#9b6bff' },
  { lv: 20, n: '৩ কিউ', c: 'বাদামি', col: '#a86b3c' }, { lv: 26, n: '১ কিউ', c: 'লাল', col: '#ef4f5a' }, { lv: 33, n: '১ দান', c: 'কালো', col: '#222' },
  { lv: 41, n: '২ দান', c: 'কালো', col: '#222' }, { lv: 50, n: '৩ দান', c: 'কালো', col: '#222' }
];
export function rank() {
  const lv = level();
  let i = 0;
  RANKS.forEach((r, k) => { if (lv >= r.lv) i = k; });
  const next = RANKS[i + 1] || null;
  return { ...RANKS[i], next, toNext: next ? next.lv - lv : 0 };
}

// ---------- ব্যাজ ----------
const doneIn = (w) => (TOPICS[w] || []).filter((t) => topicDone(t.id)).length;
const missionsDone = () => Object.values(S.missions).filter((m) => m.done).length;
export const BADGES = [
  { id: 'first', t: 'প্রথম পাস', d: 'প্রথম পরীক্ষা বা পাঠে পাস', ok: () => passedCount() >= 1 },
  { id: 'ten', t: 'দশ পাস', d: '১০টি পরীক্ষা বা পাঠে পাস', ok: () => passedCount() >= 10 },
  { id: 'fifty', t: 'পঞ্চাশ পাস', d: '৫০টি পরীক্ষা বা পাঠে পাস', ok: () => passedCount() >= 50 },
  { id: 's7', t: '৭ দিনের ধারা', d: 'টানা ৭ দিন শেখা', ok: () => streak() >= 7 },
  { id: 's30', t: '৩০ দিনের ধারা', d: 'টানা ৩০ দিন শেখা', ok: () => streak() >= 30 },
  { id: 'xp1k', t: 'এক হাজার', d: '১,০০০ অভিজ্ঞতা', ok: () => S.xp >= 1000 },
  { id: 'm10', t: 'গণিতে দশ', d: 'গণিত যাত্রার ১০ স্তর', ok: () => doneIn('mh') >= 10 },
  { id: 'm28', t: 'গণিত যাত্রী', d: 'গণিত যাত্রার প্রথম ২৮ স্তর', ok: () => doneIn('mh') >= 28 },
  { id: 'm37', t: 'গণিতের শিখর', d: 'গণিত যাত্রার সব ৩৭ স্তর', ok: () => doneIn('mh') >= 37 },
  { id: 'e5', t: 'ইংরেজিতে পাঁচ', d: 'English দক্ষতার ৫ পাঠ', ok: () => doneIn('ee') >= 5 },
  { id: 'c5', t: 'কাজের মানুষ', d: 'ক্যারিয়ারের ৫ পাঠ', ok: () => doneIn('cr') >= 5 },
  { id: 'sp6', t: 'বিজ্ঞানী', d: 'বিজ্ঞান যাত্রার ৬ স্তর', ok: () => doneIn('sp') >= 6 },
  { id: 'k5', t: 'কোডার', d: 'কোডিংয়ের ৫ পাঠ', ok: () => doneIn('cd') >= 5 },
  { id: 'ms3', t: 'হাতে-কলমে', d: '৩টি বাস্তব মিশন শেষ', ok: () => missionsDone() >= 3 },
  { id: 'grid', t: 'ঝটপট', d: 'ঝটপট ছকে ৩ তারা', ok: () => Object.values(S.grid).some((g) => g.stars >= 3) },
  { id: 'mk', t: 'ভুল থেকে শেখা', d: 'ভুলের খাতার ১০টি ভুল ঠিক করা', ok: () => (S.quests.fixed || 0) >= 10 || Object.values(S.quests).reduce((a, q) => a + (q && q.mistake || 0), 0) >= 10 },
  { id: 'stars', t: 'তারার ঝুড়ি', d: '৫০টি তারা', ok: () => totalStars() >= 50 }
];
export const earned = () => BADGES.filter((b) => b.ok());
export function newBadges() {
  const fresh = BADGES.filter((b) => b.ok() && !S.badgeSeen.includes(b.id));
  if (fresh.length) { S.badgeSeen.push(...fresh.map((b) => b.id)); save(); }
  return fresh;
}

// ---------- ঝটপট ছক (百マス計算) ----------
// ৫×৫ ঘর। ওপরে ও পাশে সংখ্যা, প্রতিটি ঘরে সারি আর কলামের সংখ্যার যোগ/বিয়োগ/গুণ। যত কম সময়ে সঠিক, তত ভালো।
export const GRID_KINDS = [
  { id: 'add', t: 'যোগ', op: '+', sec: 2.4 },
  { id: 'sub', t: 'বিয়োগ', op: '−', sec: 3 },
  { id: 'mul', t: 'গুণ (নামতা)', op: '×', sec: 3 },
  { id: 'mix', t: 'মিশ্র', op: '±', sec: 3.2 }
];
export function makeGrid(kind, size = 5) {
  const op = kind === 'mix' ? '' : kind;
  let cols, rows;
  if (kind === 'mul') { cols = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size); rows = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size); }
  else if (kind === 'sub') { cols = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size); rows = shuffle([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]).slice(0, size); }
  else { cols = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size); rows = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, size); }
  const cells = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const o = kind === 'mix' ? ((r + c) % 2 ? '−' : '+') : op === 'add' ? '+' : op === 'sub' ? '−' : '×';
    let a = rows[r], b = cols[c];
    if (kind === 'mix' && o === '−') a = rows[r] + 10;
    const ans = o === '+' ? a + b : o === '−' ? a - b : a * b;
    cells.push({ a, b, o, ans, v: '' });
  }
  return { kind, size, rows, cols, cells };
}
export const gridStars = (kind, sec, cells = 25) => {
  const per = sec / cells, k = GRID_KINDS.find((x) => x.id === kind).sec;
  return per <= k ? 3 : per <= k * 1.6 ? 2 : 1;
};
export function gridDone(kind, sec) {
  const g = S.grid[kind] || { best: 0, n: 0, stars: 0 };
  const stars = gridStars(kind, sec), prev = g.best || 0;
  const improved = !prev || sec < prev;
  S.grid[kind] = { best: improved ? Math.round(sec) : prev, n: (g.n || 0) + 1, stars: Math.max(g.stars || 0, stars) };
  save();
  return { stars, prev, improved };
}

// ---------- মিশন ----------
export const missionsFor = () => MISSIONS.filter((m) => m.band <= Math.max(2, ageBand())).sort((a, b) => (S.missions[a.id] && S.missions[a.id].done ? 1 : 0) - (S.missions[b.id] && S.missions[b.id].done ? 1 : 0) || b.band - a.band);
export function finishMission(id, note) {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m || (S.missions[id] && S.missions[id].done)) return 0;
  S.missions[id] = { done: true, note: String(note).slice(0, 400), t: Date.now() };
  S.xp += m.xp; save();
  return m.xp;
}

// ---------- আমার স্তর খুঁজি (গণিত) ----------
const PROBES = [0, 4, 8, 12, 16, 20, 24, 27, 29, 32, 36];
export const startProbe = () => ({ at: ageBand() >= 4 ? 3 : ageBand() === 3 ? 2 : ageBand() === 2 ? 1 : 0, passed: -1, failedAt: null });
export function probeQuestions(at) {
  const lv = PROBES[at], list = TOPICS.mh[lv];
  const gens = list.qs;
  return shuffle(gens).slice(0, 3).map((g, i) => {
    const r = MATH_GEN[g]();
    const idx = shuffle(r.o.map((_, k) => k));
    return { id: `pr:${lv}:${i}`, p: r.p, opts: idx.map((k, v) => ({ v, h: r.o[k] })), ans: idx.indexOf(r.a), why: r.why, show: r.show };
  });
}
export const PROBE_LEVELS = PROBES;
// ফল: ৩টির মধ্যে ২টি ঠিক হলে পাস। ওপরে উঠে যায়, ব্যর্থ হলে থামে। প্রথমেই ব্যর্থ হলে নিচে নামে।
export function probeStep(st, right) {
  const pass = right >= 3 ? true : right >= 2;
  if (pass) { st.passed = Math.max(st.passed, st.at); if (st.at >= PROBES.length - 1) return { end: true, level: PROBES[st.at] }; st.at++; return { end: false }; }
  if (st.passed >= 0) return { end: true, level: PROBES[st.passed] };
  if (st.at === 0) return { end: true, level: -1 };
  st.at--; return { end: false };
}
export function applyPlacement(level) {
  S.placed.mh = level; save();
}
