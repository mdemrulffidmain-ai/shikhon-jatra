// অভিযোজিত শেখার ইঞ্জিন: প্রতিটি পাঠের জন্য "কতটা শিখেছি" ও "কতটা মনে আছে" হিসাব রাখে।
// - দক্ষতা p: প্রতিটি প্রশ্নের পর আপডেট হয় (চলমান গড়, নতুন তথ্য বেশি ওজন পায়)।
// - স্থায়িত্ব s (দিন): ভালো ফল হলে দ্বিগুণ, খারাপ ফল হলে অর্ধেক। মনে থাকার হার R = e^(−দিন ÷ s), ভুলে যাওয়ার বক্ররেখা।
// - R প্রায় ০.৬ এর নিচে নামার আগেই (অর্থাৎ s/২ দিন পর) পাঠটি ঝালাইয়ের তালিকায় আসে।
// এটি একটি সরল মডেল। গবেষণায় পাওয়া নীতি (বিরতি দিয়ে স্মরণ, দুর্বল জায়গায় বেশি অনুশীলন) অনুসরণ করে, কিন্তু আসল ব্যক্তির মনে থাকা নিখুঁতভাবে মাপে না।
import { S, save, dayNum, topicDone, dueCount } from './state.js';
import { TOPICS, WORLD } from '../data/index.js';
import { ALLGENS } from '../data/topics.js';
import { recommend } from './interest.js';
import { localDate, daysAgo } from './util.js';

export const TM_WORLDS = ['mh', 'sp', 'ee', 'bl', 'cr', 'cd', 'life', 'sc', 'sk'];
export const allTopics = () => TM_WORLDS.flatMap((w) => (TOPICS[w] || []).map((t) => (t.w ? t : Object.assign(t, { w }))));
export const topicById = (id) => allTopics().find((t) => t.id === id);

// প্রশ্নের id থেকে পাঠের id: "mh:3:0" (পাঠের প্রশ্ন) বা "mx:mh:3:7" (মিশ্র অভ্যাস)
export function topicOfQuestion(qid, meta) {
  if (meta && meta.tid) return meta.tid;
  if (meta && meta.kind === 'topic' && meta.id) return meta.id;
  if (typeof qid === 'string' && qid.startsWith('mx:')) return qid.slice(3, qid.lastIndexOf(':'));
  return null;
}

export function answered(tid, ok) {
  if (!tid) return;
  const m = S.tm[tid] || (S.tm[tid] = { p: 0.5, n: 0, s: 1, d: dayNum(), t: 0 });
  const a = Math.max(0.2, 1 / (m.n + 2));
  m.p += a * ((ok ? 1 : 0) - m.p);
  m.n++; m.t = Date.now();
}
// একটি বসার শেষে: ফল দেখে স্থায়িত্ব বদলানো
export function settle(tally) {
  for (const [tid, x] of Object.entries(tally || {})) {
    const m = S.tm[tid]; if (!m || !x.n) continue;
    const acc = x.c / x.n;
    m.s = acc >= 0.8 ? Math.min(64, Math.max(1, m.s) * 2) : acc >= 0.5 ? Math.max(1, m.s) : Math.max(1, m.s / 2);
    m.d = dayNum(); m.t = Date.now();
  }
  save();
}
export const retention = (m) => Math.exp(-(dayNum() - m.d) / Math.max(1, m.s));
export const effective = (m) => m.p * retention(m);
export const dueGap = (m) => Math.max(1, Math.ceil(m.s / 2));
export const isDue = (m) => dayNum() - m.d >= dueGap(m);

export function dueTopics(limit = 3) {
  return allTopics().filter((t) => topicDone(t.id) && S.tm[t.id] && isDue(S.tm[t.id]) && S.tm[t.id].n >= 3)
    .sort((a, b) => (dayNum() - S.tm[b.id].d) / dueGap(S.tm[b.id]) - (dayNum() - S.tm[a.id].d) / dueGap(S.tm[a.id])).slice(0, limit);
}
export function weakTopics(limit = 3, skip = []) {
  return allTopics().filter((t) => topicDone(t.id) && S.tm[t.id] && S.tm[t.id].n >= 4 && !skip.includes(t.id) && effective(S.tm[t.id]) < 0.65)
    .sort((a, b) => effective(S.tm[a.id]) - effective(S.tm[b.id])).slice(0, limit);
}

// ---------- আজকের পরিকল্পনা ----------
// প্রতিদিন একবার তৈরি হয়। শর্ত মিটলে কাজটি "শেষ" গণ্য হয়।
export function planDone(it) {
  if (it.k === 'tm') { const m = S.tm[it.id]; return !m || !isDue(m); }
  if (it.k === 'srs') return dueCount() === 0;
  if (it.k === 'mk') return S.mistakes.length === 0;
  if (it.k === 'new') return topicDone(it.id) || (it.w && it.i !== undefined && !!S.steps[it.w + '.' + it.i]);
  if (it.k === 'wk') return weakSkills(1).length === 0;
  if (it.k === 'grid') return !!(S.quests[localDate()] || {}).grid;
  return false;
}
export function buildPlan() {
  const items = [];
  dueTopics(2).forEach((t) => items.push({ k: 'tm', id: t.id, w: t.w, t: t.t, sub: `ভুলে যাওয়ার আগে ঝালাই · ${WORLD[t.w].name}` }));
  const nd = dueCount(); if (nd) items.push({ k: 'srs', t: 'নামতা ও শব্দের পুনরাবৃত্তি', sub: `${nd}টি বাকি` });
  if (S.mistakes.length) items.push({ k: 'mk', t: 'ভুলের খাতা', sub: `${S.mistakes.length}টি ভুল ঠিক করি` });
  if (weakSkills(1).length) items.push({ k: 'wk', t: 'দুর্বল ধরনের প্রশ্ন', sub: weakSkills(2).map((w) => w.t.t.replace(/^[০-৯]+\. /, '')).join(', ') });
  const rec = recommend()[0];
  if (rec) items.push(rec.kind === 'topic' ? { k: 'new', id: rec.id, w: rec.w, t: rec.t, sub: 'নতুন পাঠ · ' + rec.sub } : { k: 'new', w: rec.w, i: rec.i, t: rec.t, sub: 'নতুন ধাপ' });
  const taken = items.filter((x) => x.k === 'tm').map((x) => x.id);
  if (items.length < 4) weakTopics(1, taken).forEach((t) => items.push({ k: 'tm', id: t.id, w: t.w, t: t.t, sub: `দুর্বল জায়গা, আরেকবার · ${WORLD[t.w].name}` }));
  if (items.length < 4) items.push({ k: 'grid', t: 'ঝটপট ছক', sub: '২৫ ঘর, নিজের সময় ভাঙো' });
  return items.slice(0, 5);
}
export function dailyPlan() {
  const day = dayNum();
  if (!S.plan || S.plan.day !== day || !S.plan.items) { S.plan = { day, items: buildPlan() }; save(true); }
  const items = S.plan.items.map((it) => ({ ...it, done: planDone(it) }));
  return { items, done: items.filter((x) => x.done).length };
}

// ---------- শেখার রিপোর্ট ----------
export function report() {
  const rows = TM_WORLDS.map((w) => {
    const list = TOPICS[w] || [], done = list.filter((t) => topicDone(t.id));
    const withTm = done.filter((t) => S.tm[t.id]);
    const eff = withTm.length ? withTm.reduce((a, t) => a + effective(S.tm[t.id]), 0) / withTm.length : null;
    return { w, name: WORLD[w].name, total: list.length, done: done.length, eff, due: withTm.filter((t) => isDue(S.tm[t.id])).length };
  }).filter((r) => r.total);
  const tops = allTopics().filter((t) => S.tm[t.id] && S.tm[t.id].n >= 3).map((t) => ({ t: t.t, w: t.w, e: effective(S.tm[t.id]), n: S.tm[t.id].n }));
  tops.sort((a, b) => b.e - a.e);
  let c = 0, wr = 0; Object.values(S.mastery).forEach((m) => { c += m.c || 0; wr += m.w || 0; });
  return { rows, strong: tops.slice(0, 3), weak: tops.slice(3).filter((x) => x.e < 0.7).slice(-3).reverse(), correct: c, wrong: wr, acc: c + wr ? c / (c + wr) : null, due: rows.reduce((a, r) => a + r.due, 0), skills: weakSkills(4) };
}

// ---------- অভিভাবকের জন্য সাপ্তাহিক সারাংশ ----------
export function weekly() {
  let active = 0, pass = 0, review = 0, grid = 0, mistake = 0;
  const bars = [];
  for (let k = 6; k >= 0; k--) {
    const d = daysAgo(k), n = S.days[d] || 0, q = S.quests[d] || {};
    if (n) active++;
    pass += q.pass || 0; review += q.review || 0; grid += q.grid || 0; mistake += q.mistake || 0;
    bars.push(Math.min(n, 12));
  }
  const r = report();
  return { active, pass, review, grid, mistake, bars, due: r.due, acc: r.acc, weak: r.weak };
}

// ---------- দক্ষতা (প্রশ্নের ধরন) ----------
// প্রতিটি প্রশ্ন-জেনারেটর একটি দক্ষতা (যেমন "দুই অঙ্কের যোগ", "লগের যোগ")। কোন ধরনের প্রশ্নে বারবার ভুল হচ্ছে, তা এখান থেকে ধরা পড়ে।
export function skillAnswered(name, ok) {
  if (!name) return;
  const m = S.sk[name] || (S.sk[name] = { p: 0.5, n: 0, t: 0 });
  const a = Math.max(0.15, 1 / (m.n + 2));
  m.p += a * ((ok ? 1 : 0) - m.p); m.n++; m.t = Date.now();
  save();
}
let _skTopic = null;
export function skillTopic(name) {
  if (!_skTopic) { _skTopic = {}; allTopics().forEach((t) => (t.qs || []).forEach((q) => { if (typeof q === 'string' && !_skTopic[q]) _skTopic[q] = t; })); }
  return _skTopic[name];
}
export function weakSkills(limit = 4) {
  return Object.entries(S.sk).filter(([k, m]) => m.n >= 4 && m.p < 0.6 && skillTopic(k) && ALLGENS[k]).sort((a, b) => a[1].p - b[1].p).slice(0, limit).map(([k, m]) => ({ k, p: m.p, n: m.n, t: skillTopic(k) }));
}
export function skillQuestions(perSkill = 2, limit = 4) {
  const out = [];
  weakSkills(limit).forEach((w) => {
    for (let i = 0; i < perSkill; i++) {
      const r = ALLGENS[w.k](), idx = r.o.map((_, k) => k).sort(() => Math.random() - 0.5);
      out.push({ id: `sk:${w.k}:${i}`, sk: w.k, p: r.p, opts: idx.map((k, v) => ({ v, h: r.o[k] })), ans: idx.indexOf(r.a), why: r.why, show: r.show, say: r.say, lang: r.lang || 'bn-BD' });
    }
  });
  return out.sort(() => Math.random() - 0.5);
}
