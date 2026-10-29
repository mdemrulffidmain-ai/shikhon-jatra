// অগ্রগতি মেলানো। ফোন আর সার্ভারের তথ্য মিলিয়ে একটি করা হয়।
// নিয়ম: যা অর্জন করা হয়েছে তা কখনো হারায় না (সর্বোচ্চ, "হ্যাঁ", ইউনিয়ন)। তাই দুই ফোনে শিখলেও কিছু হারায় না।
// ফোনের নিজস্ব জিনিস (পিন, সময়ের ব্যাংক, API কী, শব্দ) এখানে নেই, এগুলো কখনো সার্ভারে যায় না।

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const maxMap = (a = {}, b = {}) => {
  const o = { ...a };
  for (const k of Object.keys(b)) o[k] = Math.max(o[k] || 0, b[k] || 0);
  return o;
};
const orMap = (a = {}, b = {}) => {
  const o = { ...a };
  for (const k of Object.keys(b)) o[k] = isObj(b[k]) ? orMap(o[k] || {}, b[k]) : !!(o[k] || b[k]);
  return o;
};
const union = (a = [], b = []) => [...new Set([...a, ...b])];
const newer = (x, y) => ((y && (y.t || 0) > ((x && x.t) || 0)) ? y : x || y);

export const SYNC_KEYS = ['name', 'mode', 'age', 'world', 'xp', 'stars', 'steps', 'cards', 'topics', 'mastery', 'days', 'interests', 'iscore',
  'srs', 'tm', 'sk', 'missions', 'mistakes', 'grid', 'quests', 'placed', 'badgeSeen', 'ts'];

// ফোনের তথ্য থেকে শুধু সিঙ্কের অংশটুকু নেওয়া
export function pick(S) {
  const o = {};
  SYNC_KEYS.forEach((k) => { if (S[k] !== undefined) o[k] = JSON.parse(JSON.stringify(S[k])); });
  return o;
}

export function merge(a = {}, b = {}) {
  const A = a, B = b;
  const later = (A.ts || 0) >= (B.ts || 0) ? A : B; // সাম্প্রতিক পরিবর্তনকারীর পছন্দ জেতে
  const o = {};
  ['name', 'mode', 'age', 'world'].forEach((k) => { o[k] = later[k] !== undefined && later[k] !== '' ? later[k] : (A[k] || B[k] || ''); });
  o.xp = Math.max(A.xp || 0, B.xp || 0);
  o.stars = maxMap(A.stars, B.stars);
  o.steps = orMap(A.steps, B.steps);
  o.topics = orMap(A.topics, B.topics);
  o.cards = union(A.cards, B.cards);
  o.days = maxMap(A.days, B.days);
  o.iscore = maxMap(A.iscore, B.iscore);
  o.placed = maxMap(A.placed, B.placed);
  o.interests = (later.interests && later.interests.length ? later.interests : union(A.interests, B.interests)).slice(0, 4);
  o.badgeSeen = union(A.badgeSeen, B.badgeSeen);
  // দক্ষতা: সঠিক ও ভুলের সর্বোচ্চ সংখ্যা
  o.mastery = {};
  for (const k of union(Object.keys(A.mastery || {}), Object.keys(B.mastery || {}))) {
    const x = (A.mastery || {})[k] || { c: 0, w: 0 }, y = (B.mastery || {})[k] || { c: 0, w: 0 };
    o.mastery[k] = { c: Math.max(x.c, y.c), w: Math.max(x.w, y.w) };
  }
  // পুনরাবৃত্তি: যেটি সাম্প্রতিক সেটি
  o.srs = {};
  for (const k of union(Object.keys(A.srs || {}), Object.keys(B.srs || {}))) o.srs[k] = newer((A.srs || {})[k], (B.srs || {})[k]);
  // পাঠ-দক্ষতা: সাম্প্রতিক বদলটি জেতে, তবে প্রশ্নের সংখ্যা কখনো কমে না
  o.tm = {};
  for (const k of union(Object.keys(A.tm || {}), Object.keys(B.tm || {}))) {
    const x = (A.tm || {})[k], y = (B.tm || {})[k], n = newer(x, y);
    o.tm[k] = { ...n, n: Math.max((x && x.n) || 0, (y && y.n) || 0) };
  }
  // দক্ষতা (প্রশ্নের ধরন): একইভাবে
  o.sk = {};
  for (const k of union(Object.keys(A.sk || {}), Object.keys(B.sk || {}))) {
    const x = (A.sk || {})[k], y = (B.sk || {})[k], n = newer(x, y);
    o.sk[k] = { ...n, n: Math.max((x && x.n) || 0, (y && y.n) || 0) };
  }
  // মিশন: শেষ হলে শেষ, লেখাটি সাম্প্রতিকেরটি
  o.missions = {};
  for (const k of union(Object.keys(A.missions || {}), Object.keys(B.missions || {}))) {
    const x = (A.missions || {})[k], y = (B.missions || {})[k];
    const n = newer(x, y);
    o.missions[k] = { ...n, done: !!((x && x.done) || (y && y.done)) };
  }
  // ভুলের খাতা: দুই দিকের ভুল মিলিয়ে, সাম্প্রতিক ৪০টি
  const mm = {};
  [...(A.mistakes || []), ...(B.mistakes || [])].forEach((m) => { mm[m.k] = mm[m.k] ? newer(mm[m.k], m) : m; });
  o.mistakes = Object.values(mm).sort((p, q) => (q.t || 0) - (p.t || 0)).slice(0, 40);
  // ঝটপট ছকের সেরা সময়: কম ভালো
  o.grid = {};
  for (const k of union(Object.keys(A.grid || {}), Object.keys(B.grid || {}))) {
    const x = (A.grid || {})[k], y = (B.grid || {})[k];
    o.grid[k] = !x ? y : !y ? x : { best: Math.min(x.best, y.best), n: Math.max(x.n || 0, y.n || 0) };
  }
  // দৈনিক কাজ: দিন অনুযায়ী সর্বোচ্চ
  o.quests = {};
  for (const d of union(Object.keys(A.quests || {}), Object.keys(B.quests || {}))) o.quests[d] = maxMap((A.quests || {})[d], (B.quests || {})[d]);
  o.ts = Math.max(A.ts || 0, B.ts || 0);
  return o;
}

// সিঙ্কের অংশ ফোনের অবস্থায় বসানো (ফোনের নিজস্ব অংশ অক্ষত থাকে)
export function applyTo(S, m) {
  SYNC_KEYS.forEach((k) => { if (m[k] !== undefined) S[k] = m[k]; });
}
