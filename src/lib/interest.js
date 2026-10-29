// শিশুর আগ্রহ বোঝা: বাছাই করা আগ্রহ + আচরণ (কোন পাঠে পাস করেছে, কত ভালো করেছে)।
import { S, save, topicDone, topicUnlocked, isDone, nodeUnlocked, nodeDone, ageBand } from './state.js';
import { TOPICS, SUBJECTS, INTERESTS } from '../data/index.js';

export const MAX_PICK = 4;
const WORLDS_BY_AGE = { 1: ['ai', 'life', 'sc', 'sk'], 2: ['ai', 'mh', 'ee', 'bl', 'life', 'sc', 'sk'], 3: ['ai', 'mh', 'sp', 'ee', 'bl', 'cr', 'cd', 'sc', 'sk', 'life'], 4: ['ai', 'cr', 'cd', 'mh', 'sp', 'ee', 'bl', 'sk'] };

export function score(tag) {
  return (S.interests.includes(tag) ? 5 : 0) + (S.iscore[tag] || 0);
}

// পাঠ শেষ হলে ট্যাগগুলোর নম্বর বাড়ে। ভালো ফলে বেশি।
export function learnedFrom(tags, stars) {
  (tags || []).forEach((t) => { S.iscore[t] = (S.iscore[t] || 0) + 1 + (stars >= 3 ? 1 : 0); });
  save();
}

export function topInterests(n = 3) {
  return INTERESTS.map((i) => ({ id: i.id, n: i.n, s: score(i.id) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n);
}

export const topicScore = (t) => (t.tags || []).reduce((a, g) => a + score(g), 0);

export function listFor(w) {
  return w === 'ai' ? S.ai.lessons : TOPICS[w] || [];
}

// আজকের সুপারিশ: মূল পথের পরের ধাপ + আগ্রহ মেলানো দুটি পাঠ
export function recommend() {
  const out = [];
  const ab = ageBand();
  for (const w of ab >= 3 ? [] : ['bn', 'en', 'mt']) {
    const nodes = SUBJECTS[w].nodes;
    const i = nodes.findIndex((n, k) => nodeUnlocked(w, k) && !nodeDone(w, k));
    if (i >= 0) { out.push({ kind: 'node', w, i, t: nodes[i].t, sub: SUBJECTS[w].name, why: 'পথের পরের ধাপ' }); break; }
  }
  const pool = [];
  (WORLDS_BY_AGE[ab] || WORLDS_BY_AGE[2]).forEach((w) => listFor(w).forEach((t) => {
    if (!t.w) t.w = w;
    if (!topicDone(t.id) && topicUnlocked(t, listFor(w))) pool.push(t);
  }));
  pool.sort((a, b) => topicScore(b) - topicScore(a) || (a.req || 1) - (b.req || 1));
  pool.slice(0, ab >= 3 ? 3 : 2).forEach((t) => out.push({ kind: 'topic', id: t.id, w: t.w, t: t.t, icon: t.icon, sub: t.tags && t.tags.length ? 'তোমার আগ্রহ মেলে' : 'নতুন পাঠ', why: 'আগ্রহ অনুযায়ী' }));
  return out;
}
