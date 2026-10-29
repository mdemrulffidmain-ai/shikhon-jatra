// অগ্রগতি সংরক্ষণ: ফোনে Preferences, ব্রাউজারে localStorage। ইন্টারনেট লাগে না।
import { Preferences } from '@capacitor/preferences';
import { SUBJECTS, CARDS } from '../data/index.js';
import { localDate, daysAgo } from './util.js';

const KEY = 'shikhon.v3';
export const DAILY_GOAL = 3;

const def = () => ({
  v: 4, name: '', mode: '', age: 0, xp: 0, ts: 0,
  srs: {}, tm: {}, sk: {}, plan: {}, missions: {}, mistakes: [], grid: {}, quests: {}, placed: {}, badgeSeen: [],
  account: { server: '', user: '', token: '', last: 0 },
  stars: {}, steps: {}, cards: [], topics: {}, mastery: {}, days: {},
  sound: true, rate: 0.8, world: 'bn',
  interests: [], iscore: {},
  time: { freeUntil: 0, restUntil: 0, lv: {} },
  parent: { pinHash: '', free: 10, rest: 10, cap: 6, lock: false },
  ai: { on: false, provider: 'anthropic', key: '', model: 'claude-sonnet-5-5', base: '', lessons: [] }
});

export const S = def();

export async function loadState() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (value) {
      const o = JSON.parse(value), d = def();
      Object.assign(S, d, o);
      S.time = Object.assign(d.time, o.time || {});
      S.parent = Object.assign(d.parent, o.parent || {});
      S.ai = Object.assign(d.ai, o.ai || {});
      S.account = Object.assign(d.account, o.account || {});
    }
  } catch (e) { /* প্রথমবার বা পড়া যায়নি: নতুন করে শুরু */ }
}

let timer, hook = null;
export const onSave = (fn) => { hook = fn; };
export function save(local = false) {
  if (!local) S.ts = Date.now();
  if (hook && !local) hook();
  clearTimeout(timer);
  timer = setTimeout(() => { Preferences.set({ key: KEY, value: JSON.stringify(S) }).catch(() => {}); }, 120);
}

export async function resetAll() {
  Object.keys(S).forEach((k) => delete S[k]);
  Object.assign(S, def());
  try { await Preferences.remove({ key: KEY }); } catch (e) { /* ঠিক আছে */ }
}

// ---------- ধাপ ও তালা ----------
export const nk = (s, i) => `${s}.${i}`;
export const stepsOf = (s, i) => S.steps[nk(s, i)] || {};
export const isDone = (s, i, name) => !!stepsOf(s, i)[name];
export const nodeDone = (s, i) => isDone(s, i, 'test');
export const topicDone = (id) => !!S.topics[id];

export function passedCount() {
  return Object.keys(S.steps).filter((k) => S.steps[k].test).length + Object.keys(S.topics).length;
}

export const ageBand = () => S.age || 2;

export function worldUnlocked(w) {
  const ab = ageBand();
  if (w === 'bn') return true;
  if (w === 'en' || w === 'mt') return nodeDone('bn', 0);
  if (w === 'mh') return ab >= 2 || nodeDone('mt', 3) || S.placed.mh !== undefined;
  if (w === 'ee') return ab >= 2 || nodeDone('en', 1);
  if (w === 'bl') return ab >= 2 || nodeDone('bn', 3);
  if (w === 'cr') return ab >= 3 || level() >= 5;
  if (w === 'cd') return ab >= 3 || level() >= 4;
  if (w === 'sp') return ab >= 3 || level() >= 4;
  if (w === 'life' || w === 'sc') return passedCount() >= 2;
  if (w === 'sk') return passedCount() >= 4;
  if (w === 'ai') return S.ai.on;
  return false;
}

export function worldWhy(w) {
  if (w === 'en' || w === 'mt') return 'বাংলার প্রথম ধাপের পরীক্ষা পাস করলে খুলবে।';
  if (w === 'mh') return 'গণিতের "যোগ ১" ধাপ পাস করলে খুলবে (বা বড়দের জন্য শুরুতেই "আমার স্তর খুঁজি" দিয়ে)।';
  if (w === 'ee') return 'English এর দ্বিতীয় ধাপ পাস করলে খুলবে।';
  if (w === 'bl') return 'বাংলার চতুর্থ ধাপ পাস করলে খুলবে।';
  if (w === 'cr') return 'লেভেল ৫ হলে খুলবে।';
  if (w === 'cd' || w === 'sp') return 'লেভেল ৪ হলে খুলবে।';
  if (w === 'sk') return 'যেকোনো চারটি পরীক্ষা বা পাঠে পাস করলে এই বই খুলবে।';
  return 'যেকোনো দুটি পরীক্ষা বা পাঠে পাস করলে এই বই খুলবে।';
}

export function nodeUnlocked(s, i) {
  return worldUnlocked(s) && (i === 0 || nodeDone(s, i - 1));
}

export function stepUnlocked(s, i, name) {
  const order = SUBJECTS[s].nodes[i].steps;
  const at = order.indexOf(name);
  return at <= 0 || isDone(s, i, order[at - 1]);
}

// পাঠ খোলা আছে কিনা: জগৎ খোলা, লেভেল যথেষ্ট, আর "linear" হলে আগের পাঠ শেষ
export function topicUnlocked(t, list) {
  if (!worldUnlocked(t.w)) return false;
  // ১২ বছর বা বেশি বয়সী শিক্ষার্থী লেভেলের শর্ত ছাড়াই শুরু করতে পারে (শুধু ক্রমের তালা থাকে)
  if (ageBand() <= 2 && level() < (t.req || 1)) return false;
  if (t.linear) {
    const k = list.indexOf(t);
    const placed = S.placed[t.w] === undefined ? -1 : S.placed[t.w];
    return k <= 0 || k <= placed + 1 || topicDone(list[k - 1].id);
  }
  return true;
}

export function markStep(s, i, name) {
  const k = nk(s, i);
  S.steps[k] = S.steps[k] || {};
  const first = !S.steps[k][name];
  S.steps[k][name] = true;
  save();
  return first;
}

// ---------- XP, দিন, ধারাবাহিকতা ----------
export const level = () => Math.floor(S.xp / 100) + 1;
export const levelPct = () => (S.xp % 100) / 100;
export function addXP(n) { S.xp += n; touchToday(); save(); }
export function touchToday() { const d = localDate(); S.days[d] = (S.days[d] || 0) + 1; }
export const todayCount = () => S.days[localDate()] || 0;

export function streak() {
  let n = 0;
  let k = S.days[daysAgo(0)] ? 0 : 1;
  while (S.days[daysAgo(k)]) { n++; k++; }
  return n;
}
export function totalStars() { return Object.keys(S.stars).reduce((a, k) => a + S.stars[k], 0); }

// ---------- দক্ষতা (কোন জিনিসে ভুল হয়) ----------
export function record(id, ok) {
  if (!id) return;
  const m = S.mastery[id] || (S.mastery[id] = { c: 0, w: 0 });
  if (ok) m.c++; else m.w++;
  if (/^(x|v)\|/.test(id)) reviewSrs(id, ok);
  save();
}

// ---------- পুনরাবৃত্তির সময়সূচি (লাইটনার বাক্স: ১, ২, ৪, ৮, ১৬, ৩২ দিন পরপর) ----------
export const GAPS = [1, 2, 4, 8, 16, 32];
export const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
export function reviewSrs(id, ok) {
  const c = S.srs[id] || { b: 0, due: 0, t: 0 };
  c.b = ok ? Math.min(c.b + 1, GAPS.length) : 0;
  c.due = dayNum() + (ok ? GAPS[c.b - 1] : 1);
  c.t = Date.now();
  S.srs[id] = c;
}
export function dueIds(limit = 8) {
  const today = dayNum();
  return Object.entries(S.srs).filter(([, c]) => c.due <= today).sort((a, b) => a[1].due - b[1].due).slice(0, limit).map(([id]) => id);
}
export const dueCount = () => { const t = dayNum(); return Object.values(S.srs).filter((c) => c.due <= t).length; };

export function learnedNodes() {
  const out = [];
  Object.keys(SUBJECTS).forEach((s) => {
    SUBJECTS[s].nodes.forEach((n, i) => { if (isDone(s, i, 'learn')) out.push({ s, i }); });
  });
  return out;
}

export function weakItems(limit = 5) {
  const all = [];
  Object.keys(SUBJECTS).forEach((s) => SUBJECTS[s].nodes.forEach((n) => n.items.forEach((it) => {
    const m = S.mastery[it.id];
    if (m && m.w > m.c) all.push({ it, gap: m.w - m.c });
  })));
  return all.sort((a, b) => b.gap - a.gap).slice(0, limit).map((x) => x.it);
}

// ---------- জ্ঞান কার্ড ----------
export function awardCard() {
  const next = CARDS.find((c) => !S.cards.includes(c.id));
  if (next) { S.cards.push(next.id); save(); }
  return next || null;
}
