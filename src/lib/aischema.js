// AI এর উত্তর যাচাই: ঠিক গড়ন না হলে বাদ। কোনো নেটওয়ার্ক বা ফোনের প্লাগইন লাগে না, তাই আলাদা পরীক্ষা করা যায়।
import { INTERESTS } from '../data/index.js';

export const ICONS = ['drop', 'sparkle', 'apple', 'moon', 'shield', 'coin', 'book', 'clock', 'tree', 'sun', 'heart', 'leaf', 'house', 'fish', 'star', 'jar', 'chart', 'shop'];

export const clean = (s, max) => String(s).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

// AI এর উত্তর কঠোরভাবে যাচাই করা: ভুল গড়ন হলে বাদ
export function validateLesson(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const t = clean(raw.t, 40);
  const cards = Array.isArray(raw.cards) ? raw.cards.map((c) => clean(c, 160)).filter(Boolean) : [];
  if (!t || cards.length < 2 || cards.length > 6) return null;
  const qs = [];
  for (const q of Array.isArray(raw.qs) ? raw.qs : []) {
    const o = Array.isArray(q.o) ? q.o.map((x) => clean(x, 60)) : [];
    if (!q.p || o.length !== 3 || o.some((x) => !x) || new Set(o).size !== 3) return null;
    if (!Number.isInteger(q.a) || q.a < 0 || q.a > 2) return null;
    qs.push({ p: clean(q.p, 140), o, a: q.a, why: clean(q.why || '', 160) || 'সঠিক উত্তরটি পাঠে আছে।' });
  }
  if (qs.length < 3) return null;
  const known = INTERESTS.map((i) => i.id);
  return {
    id: 'ai:' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    w: 'ai', t, icon: ICONS.includes(raw.icon) ? raw.icon : 'sparkle',
    tags: (Array.isArray(raw.tags) ? raw.tags : []).filter((g) => known.includes(g)).slice(0, 3),
    req: 1, cards, qs: qs.slice(0, 4), ai: true
  };
}

export function parseLesson(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return validateLesson(JSON.parse(text.slice(a, b + 1))); } catch (e) { return null; }
}

