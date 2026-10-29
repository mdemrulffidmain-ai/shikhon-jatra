// পরীক্ষা ও অনুশীলনের প্রশ্ন তৈরি। প্রতিটি প্রশ্নে ঠিক একটি সঠিক উত্তর থাকে।
import { SUBJECTS } from '../data/index.js';
import { esc, bd, shuffle, rnd } from './util.js';
import { dotsHtml, coinHtml, swatch, ui } from '../ui/art.js';

function distractors(pool, it, key, k = 2) {
  const seen = new Set([it[key]]);
  const out = [];
  for (const p of shuffle(pool)) {
    if (!seen.has(p[key])) { seen.add(p[key]); out.push(p); }
    if (out.length === k) break;
  }
  return out;
}

function pickOpts(pool, it, key, fmt) {
  return shuffle([it, ...distractors(pool, it, key)]).map((x) => ({ v: x[key], h: fmt ? fmt(x) : String(x[key]) }));
}

function numOpts(ans, min, max, fmt) {
  const set = [ans];
  for (const d of shuffle([1, -1, 2, -2, 3, -3])) {
    const v = ans + d;
    if (v >= min && v <= max && !set.includes(v)) set.push(v);
    if (set.length === 3) break;
  }
  return shuffle(set).map((v) => ({ v, h: fmt ? fmt(v) : bd(v) }));
}

const big = (t) => `<div class="q-big">${esc(t)}</div>`;

function blank(it, pool) {
  if (!it.tip.includes(it.label)) return null;
  return {
    id: it.id, p: 'ফাঁকা জায়গায় কোন শব্দ বসবে?',
    show: `<div class="q-sent">${esc(it.tip.replace(it.label, '____'))}</div>`,
    opts: pickOpts(pool, it, 'label'), ans: it.label,
    why: `সঠিক শব্দ: ${it.label}। ${it.tip}`
  };
}

function letterQ(it, k, pool) {
  const kind = it.ws ? k % 3 : 2;
  if (kind === 0) {
    return { id: it.id, p: 'এই অক্ষর দিয়ে কোন শব্দ শুরু?', show: big(it.ch), opts: pickOpts(pool, it, 'label'), ans: it.label, why: `${it.ch} দিয়ে শুরু: ${it.label}।` };
  }
  if (kind === 1) {
    return { id: it.id, p: 'শব্দটি কোন অক্ষর দিয়ে শুরু?', show: big(it.label), say: it.label, opts: pickOpts(pool, it, 'ch'), ans: it.ch, why: `${it.label} শুরু হয় ${it.ch} দিয়ে।` };
  }
  return blank(it, pool) || { id: it.id, p: 'এই অক্ষরটি কোনটি?', show: big(it.ch), opts: pickOpts(pool, it, 'ch'), ans: it.ch, why: `এটি ${it.ch}।` };
}

function wordQ(it, k, pool) {
  if (it.swatch && k % 2 === 0) {
    const sw = pool.filter((x) => x.swatch);
    return { id: it.id, p: 'এই রঙের নাম কী?', show: swatch(it.swatch), opts: pickOpts(sw.length > 2 ? sw : pool, it, 'label'), ans: it.label, why: `এই রঙ: ${it.label}।` };
  }
  if (k % 2 === 0) {
    return { id: it.id, p: 'কোন শব্দটি শুনলে?', show: `<div class="q-ear">${ui('speaker', 'ui big')}</div>`, say: it.label, opts: pickOpts(pool, it, 'label'), ans: it.label, why: `শব্দটি ছিল: ${it.label}।` };
  }
  return blank(it, pool) || { id: it.id, p: 'কোন শব্দটি শুনলে?', show: `<div class="q-ear">${ui('speaker', 'ui big')}</div>`, say: it.label, opts: pickOpts(pool, it, 'label'), ans: it.label, why: `শব্দটি ছিল: ${it.label}।` };
}

function numQ(it, k, pool) {
  if (!it.big && k % 2 === 0) {
    return { id: it.id, p: 'কয়টি আছে?', show: dotsHtml(it.n), opts: pickOpts(pool.filter((x) => !x.big), it, 'n', (x) => x.ch), ans: it.n, why: `গুনে দেখো: ${it.ch} (${it.label})।` };
  }
  return { id: it.id, p: 'কোন সংখ্যাটি শুনলে?', show: big(it.label), say: it.label, opts: pickOpts(pool.filter((x) => !!x.big === !!it.big), it, 'n', (x) => x.ch), ans: it.n, why: `${it.label} মানে ${it.ch}।` };
}

function calcQ(it) {
  const dots = it.a <= 10 && it.b <= 10 ? `<div class="q-dots">${dotsHtml(it.a)}<span class="q-op">${it.op === '+' ? '+' : '−'}</span>${dotsHtml(it.b)}</div>` : '';
  return {
    id: it.id, p: 'উত্তর কত?', show: big(`${it.expr} = ?`) + dots,
    opts: numOpts(it.n, 0, 10), ans: it.n, why: `${it.expr} = ${bd(it.n)}। ${it.tip}`
  };
}

function moneyQ(it, k, pool) {
  if (k % 2 === 0) {
    return { id: it.id, p: 'এটি কত টাকা?', show: `<div class="q-coin">${coinHtml(it.n, 'coin xl')}</div>`, opts: pickOpts(pool, it, 'n', (x) => bd(x.n) + ' টাকা'), ans: it.n, why: `এটি ${bd(it.n)} টাকা।` };
  }
  const vals = [1, 2, 5];
  const a = vals[rnd(3)], b = vals[rnd(3)], t = a + b;
  return {
    id: it.id, p: `${bd(a)} টাকা আর ${bd(b)} টাকা মিলে কত?`,
    show: `<div class="q-coin">${coinHtml(a)}<span class="q-op">+</span>${coinHtml(b)}</div>`,
    opts: numOpts(t, 1, 12, (v) => bd(v) + ' টাকা'), ans: t, why: `${bd(a)} + ${bd(b)} = ${bd(t)} টাকা।`
  };
}

const MAKERS = { letter: letterQ, word: wordQ, num: numQ, calc: calcQ, money: moneyQ };

// প্রশ্ন তৈরি। এই ধাপের জিনিসগুলো ঘুরিয়ে ঘুরিয়ে ব্যবহার হয়।
export function questions(subjId, ni, n = 5) {
  const sj = SUBJECTS[subjId];
  const node = sj.nodes[ni];
  const pool = sj.nodes.filter((x) => x.group === node.group).flatMap((x) => x.items);
  const base = shuffle(node.items);
  const out = [];
  for (let k = 0; k < n; k++) {
    const it = base[k % base.length];
    const q = MAKERS[node.type](it, k, pool);
    q.lang = sj.lang;
    out.push(q);
  }
  return out;
}

// অনুশীলন: শেখা ধাপগুলো থেকে প্রশ্ন; যেগুলোতে বেশি ভুল হয়েছে সেগুলো আগে
export function practiceQuestions(learned, mastery, n = 5) {
  if (!learned.length) return [];
  const weak = (s, i) => SUBJECTS[s].nodes[i].items.reduce((a, it) => {
    const m = mastery[it.id];
    return a + (m ? Math.max(0, m.w - m.c) : 0);
  }, 0);
  const sorted = learned.slice().sort((x, y) => weak(y.s, y.i) - weak(x.s, x.i) + (Math.random() - 0.5) * 0.9);
  const out = [];
  for (let k = 0; k < n; k++) {
    const pick = sorted[k % Math.min(sorted.length, 3 + (k % 2))];
    const qs = questions(pick.s, pick.i, 5);
    out.push(qs[rnd(qs.length)]);
  }
  return out;
}
