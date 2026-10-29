// গণিত যাত্রা: ২৮টি স্তর, ১০০ পর্যন্ত সংখ্যা থেকে ক্যালকুলাসের শুরু পর্যন্ত।
// প্রতিটি প্রশ্ন প্রতিবার নতুন করে তৈরি হয় এবং উত্তর কোড দিয়ে হিসাব করা, তাই লেখার ভুলে উত্তর ভুল হওয়ার সুযোগ নেই।
// শেখানোর ক্রম: বাস্তব জিনিস → ছবি (বার মডেল, অ্যাবাকাস, চাকা) → সংখ্যা ও সূত্র। (সিঙ্গাপুর/সাংহাই ও জাপানের পদ্ধতির ধারণা)
import { bd, shuffle, rnd } from '../lib/util.js';
import { abacus, pie, bar, blocks, rect, rightTri } from '../ui/vis.js';

const R = (a, b) => a + rnd(b - a + 1);
const one = (arr) => arr[rnd(arr.length)];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const neg = (v) => (v < 0 ? '−' + bd(-v) : bd(v));
const MUL = '×', DIV = '÷', MINUS = '−';

// বাংলাদেশি কমা: ১২,৩৪,৫৬৭
export function bdg(n) {
  const s = String(Math.abs(n));
  let out;
  if (s.length <= 3) out = s;
  else { const last = s.slice(-3); let rest = s.slice(0, -3); const parts = []; while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); } if (rest) parts.unshift(rest); out = parts.join(',') + ',' + last; }
  return (n < 0 ? '−' : '') + bd(out);
}

// সংখ্যার উত্তর + ভুল বিকল্প (সবসময় ৪টি আলাদা)
export function pickNum(ans, cands, fmt = bd, min = -1e9) {
  const set = [ans];
  for (const c of cands) if (!set.includes(c) && c >= min && set.length < 4) set.push(c);
  for (let d = 1; set.length < 4; d++) for (const c of [ans + d, ans - d]) if (!set.includes(c) && c >= min && set.length < 4) set.push(c);
  const vals = shuffle(set);
  return { o: vals.map(fmt), a: vals.indexOf(ans) };
}
// লেখার উত্তর + ভুল বিকল্প (ভুলগুলো আলাদা ও উত্তরের সমান নয়)
export function pickStr(ans, wrongs) {
  const w = [...new Set(wrongs.filter((x) => x !== ans))].slice(0, 3);
  const vals = shuffle([ans, ...w]);
  return { o: vals, a: vals.indexOf(ans) };
}

const GEN = {};

// ---- স্তর ১: ১০০ পর্যন্ত সংখ্যা ----
GEN.place2 = () => {
  const n = R(11, 99), t = Math.floor(n / 10), u = n % 10, askT = rnd(2) === 0;
  const ans = askT ? t : u;
  return { p: `${bd(n)} এ ${askT ? 'দশকের' : 'এককের'} ঘরে কোন অঙ্ক?`, ...pickNum(ans, askT ? [u, t + 1, t - 1] : [t, u + 1, u - 1], bd, 0), why: `${bd(n)} = ${bd(t)} দশ + ${bd(u)} এক। তাই ${askT ? 'দশকের' : 'এককের'} ঘরে ${bd(ans)}।`, show: blocks(n) };
};
GEN.cmp2 = () => {
  let a = R(12, 98), b = R(12, 98);
  while (a === b || Math.abs(a - b) < 3) { a = R(12, 98); b = R(12, 98); }
  const big = rnd(2) === 0;
  const ans = big ? Math.max(a, b) : Math.min(a, b);
  const other = ans === a ? b : a;
  return { p: `কোনটি ${big ? 'বড়' : 'ছোট'}: ${bd(a)} নাকি ${bd(b)}?`, ...pickStr(bd(ans), [bd(other), 'দুটি সমান', 'বলা যায় না']), why: `আগে দশকের ঘর দেখি। ${bd(Math.max(a, b))} বড়, ${bd(Math.min(a, b))} ছোট।` };
};
GEN.expand = () => {
  const n = R(21, 98), t = Math.floor(n / 10), u = n % 10;
  return { p: `${bd(t * 10)} + ${bd(u)} = ?`, ...pickNum(n, [n + 10, n - 10, t + u, u * 10 + t]), why: `${bd(t)} দশ আর ${bd(u)} এক মিলে ${bd(n)}।` };
};
GEN.read = () => {
  const n = R(10, 99);
  return { p: 'এই অ্যাবাকাসে কোন সংখ্যা দেখানো হয়েছে?', show: abacus(n, 2), ...pickNum(n, [Math.floor(n / 10) + (n % 10) * 10, n + 5, n - 5, n + 10]), why: `ওপরের পুঁতি ৫, নিচের প্রতিটি ১। বাঁ রডে ${bd(Math.floor(n / 10))} দশ, ডান রডে ${bd(n % 10)} এক। মিলে ${bd(n)}।` };
};

// ---- স্তর ২, ৩: যোগ ----
GEN.add2 = () => {
  const ao = R(1, 8), bo = R(0, 9 - ao), at = R(1, 8), bt = R(1, 8 - 0);
  const a = at * 10 + ao, b = bt * 10 + bo, s = a + b;
  return { p: `${bd(a)} + ${bd(b)} = ?`, ...pickNum(s, [s + 10, s - 10, s + 1, s - 1]), why: `আগে একক: ${bd(ao)} + ${bd(bo)} = ${bd(ao + bo)}। তারপর দশক: ${bd(at)} + ${bd(bt)} = ${bd(at + bt)} দশ। মোট ${bd(s)}।` };
};
GEN.add2c = () => {
  const ao = R(3, 9), bo = R(10 - ao, 9), at = R(1, 7), bt = R(1, 8 - at + 0);
  const a = at * 10 + ao, b = bt * 10 + bo, s = a + b;
  return { p: `${bd(a)} + ${bd(b)} = ?`, ...pickNum(s, [s - 10, s + 10, s - 1, s + 1]), why: `একক: ${bd(ao)} + ${bd(bo)} = ${bd(ao + bo)}। এক দশ হাতে রাখি, এককে থাকে ${bd((ao + bo) % 10)}। দশক: ${bd(at)} + ${bd(bt)} + ১ = ${bd(at + bt + 1)}। উত্তর ${bd(s)}।` };
};
GEN.partwhole = () => {
  const total = R(30, 95), a = R(11, total - 10), b = total - a;
  const askFirst = rnd(2) === 0;
  return { p: `${askFirst ? '?' : bd(a)} + ${askFirst ? bd(b) : '?'} = ${bd(total)} হলে ? কত?`, show: bar(askFirst ? [{ v: a, l: '?' }, b] : [a, { v: b, l: '?' }], bd(total)), ...pickNum(askFirst ? a : b, [a + 10, b + 10, a - 1, b + 1, a + 1], bd, 0), why: `মোট থেকে জানা অংশ বাদ দিই: ${bd(total)} − ${bd(askFirst ? b : a)} = ${bd(askFirst ? a : b)}।` };
};

// ---- স্তর ৪: বিয়োগ ----
GEN.sub2 = () => {
  const bo = R(0, 8), ao = R(bo, 9), at = R(2, 9), bt = R(1, at - 1);
  const a = at * 10 + ao, b = bt * 10 + bo, d = a - b;
  return { p: `${bd(a)} ${MINUS} ${bd(b)} = ?`, ...pickNum(d, [d + 10, d - 10, d + 1, d - 1], bd, 0), why: `একক: ${bd(ao)} − ${bd(bo)} = ${bd(ao - bo)}। দশক: ${bd(at)} − ${bd(bt)} = ${bd(at - bt)}। উত্তর ${bd(d)}।` };
};
GEN.sub2b = () => {
  const ao = R(0, 5), bo = R(ao + 1, 9), at = R(3, 9), bt = R(1, at - 1);
  const a = at * 10 + ao, b = bt * 10 + bo, d = a - b;
  return { p: `${bd(a)} ${MINUS} ${bd(b)} = ?`, ...pickNum(d, [d + 10, d - 10, d + 2, d - 2], bd, 0), why: `${bd(ao)} থেকে ${bd(bo)} বাদ যায় না, তাই এক দশ ভেঙে ${bd(ao + 10)} করি। ${bd(ao + 10)} − ${bd(bo)} = ${bd(ao + 10 - bo)}। দশকে ${bd(at - 1)} − ${bd(bt)} = ${bd(at - 1 - bt)}। উত্তর ${bd(d)}।` };
};

// ---- স্তর ৫–৭: নামতা (জাপানের ৯৯ আর চীনের গুণের ছড়ার মতো) ----
export function mulFactQ(a, b) {
  const p = a * b;
  return { id: `x|${a}|${b}`, p: `${bd(a)} ${MUL} ${bd(b)} = ?`, ...pickNum(p, [p + a, p - a, a * (b + 1), a + b], bd, 0), why: `${bd(a)} এর নামতা: ${bd(a)} ${MUL} ${bd(b)} = ${bd(p)}। (${bd(a)} করে ${bd(b)} বার যোগ)` };
}
const table = (list, hi = 10) => () => mulFactQ(one(list), R(2, hi));
GEN.t2510 = table([2, 5, 10]);
GEN.t34 = table([3, 4]);
GEN.t69 = table([6, 7, 8, 9], 9);
GEN.tmix = table([2, 3, 4, 5, 6, 7, 8, 9], 9);
GEN.skip = () => {
  const d = one([2, 3, 4, 5, 6, 7, 8, 9, 10]), a = d * R(1, 3), ans = a + 4 * d;
  return { p: `${[0, 1, 2, 3].map((k) => bd(a + k * d)).join(', ')}, ? পরের সংখ্যা কত?`, ...pickNum(ans, [ans + d, ans - d, ans + 1, ans - 1]), why: `প্রতিবার ${bd(d)} করে বাড়ছে। ${bd(a + 3 * d)} + ${bd(d)} = ${bd(ans)}।` };
};
GEN.arrays = () => {
  const r = R(2, 7), c = R(3, 8), p = r * c;
  return { p: `একটি খাতায় ${bd(r)} সারিতে ${bd(c)}টি করে ছবি আছে। মোট কয়টি ছবি?`, ...pickNum(p, [r + c, p + r, p - c, p + c], bd, 0), why: `${bd(r)} সারি ${MUL} ${bd(c)} = ${bd(p)}টি।` };
};

// ---- স্তর ৮: ভাগ ----
GEN.div = () => {
  const b = R(2, 9), q = R(2, 9), a = b * q;
  return { p: `${bd(a)} ${DIV} ${bd(b)} = ?`, ...pickNum(q, [q + 1, q - 1, b, q + 2], bd, 1), why: `ভাগ মানে গুণের উল্টো। ${bd(b)} ${MUL} ${bd(q)} = ${bd(a)}, তাই ${bd(a)} ${DIV} ${bd(b)} = ${bd(q)}।` };
};
GEN.divword = () => {
  const b = R(2, 8), q = R(3, 9), a = b * q, item = one(['আম', 'কলা', 'কলম', 'লজেন্স']);
  return { p: `${bd(a)}টি ${item} ${bd(b)} জনকে সমান ভাগ করে দিলে একজন কয়টি পাবে?`, ...pickNum(q, [q + 1, q - 1, a - b, b]), why: `${bd(a)} ${DIV} ${bd(b)} = ${bd(q)}টি।` };
};

// ---- স্তর ৯: ভগ্নাংশ ----
GEN.fracpie = () => {
  const d = one([2, 3, 4, 5, 6, 8]), n = R(1, d - 1);
  const ans = `${bd(n)}/${bd(d)}`;
  return { p: 'চাকার কত অংশ রঙিন?', show: pie(n, d), ...pickStr(ans, [`${bd(d - n)}/${bd(d)}`, `${bd(n)}/${bd(d + 1)}`, `${bd(d)}/${bd(n)}`, `${bd(n + 1)}/${bd(d)}`]), why: `চাকা ${bd(d)} ভাগ, তার ${bd(n)} ভাগ রঙিন। তাই ${ans}।` };
};
GEN.fracof = () => {
  const d = one([2, 3, 4, 5]), n = R(1, d - 1), k = R(2, 6), whole = d * k, ans = n * k;
  return { p: `${bd(whole)} এর ${bd(n)}/${bd(d)} অংশ কত?`, ...pickNum(ans, [whole - ans, k, ans + k, ans - 1], bd, 0), why: `${bd(whole)} কে ${bd(d)} ভাগ করলে প্রতি ভাগে ${bd(k)}। ${bd(n)} ভাগে ${bd(ans)}।` };
};
GEN.fraccmp = () => {
  const d = R(4, 12), a = R(1, d - 2), b = R(a + 1, d - 1);
  return { p: `কোনটি বড়: ${bd(a)}/${bd(d)} নাকি ${bd(b)}/${bd(d)}?`, ...pickStr(`${bd(b)}/${bd(d)}`, [`${bd(a)}/${bd(d)}`, 'দুটি সমান', 'বলা যায় না']), why: `হর সমান হলে যার লব বড় সেটি বড়। ${bd(b)} > ${bd(a)}।` };
};
GEN.fracequiv = () => {
  const d = one([2, 3, 4, 5]), n = R(1, d - 1), k = R(2, 5);
  return { p: `${bd(n)}/${bd(d)} = ?/${bd(d * k)}। ? কত?`, ...pickNum(n * k, [n * k + 1, n * k - 1, n + k, d * k - n], bd, 1), why: `হর ${bd(d)} থেকে ${bd(d * k)} হয়েছে ${bd(k)} গুণ। লবও ${bd(k)} গুণ: ${bd(n)} ${MUL} ${bd(k)} = ${bd(n * k)}।` };
};

// ---- স্তর ১০: সময় ও মাপ ----
const clock = (m) => `${bd(Math.floor(m / 60))}:${bd(String(m % 60).padStart(2, '0'))}`;
GEN.timeadd = () => {
  const h = R(1, 8), m = one([0, 10, 15, 20, 30, 40, 45]), add = one([20, 25, 35, 40, 45, 50, 55, 70, 80]);
  const start = h * 60 + m, ans = start + add;
  return { p: `${clock(start)} থেকে ${bd(add)} মিনিট পরে কয়টা বাজবে?`, ...pickNum(ans, [ans + 10, ans - 10, ans + 5, ans - 5, ans + 60], clock), why: `${clock(start)} এর সাথে ${bd(add)} মিনিট যোগ করলে ${clock(ans)}।` };
};
GEN.unit = () => {
  const kinds = [['মিটার', 'সেন্টিমিটার', 100], ['কেজি', 'গ্রাম', 1000], ['লিটার', 'মিলিলিটার', 1000], ['ঘণ্টা', 'মিনিট', 60], ['কিলোমিটার', 'মিটার', 1000]];
  const [big, small, f] = one(kinds), n = R(2, 9), ans = n * f;
  return { p: `${bd(n)} ${big} = কত ${small}?`, ...pickNum(ans, [n * f * 10, n * f / 10, n + f, n * (f === 60 ? 100 : 10)], bd, 1), why: `১ ${big} = ${bd(f)} ${small}। তাই ${bd(n)} ${big} = ${bd(n)} ${MUL} ${bd(f)} = ${bd(ans)} ${small}।` };
};

// ---- স্তর ১১: বড় সংখ্যা ও গোল করা ----
GEN.bigplace = () => {
  const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5), n = +ds.join(''), pos = R(0, 4), digit = ds[pos];
  const place = ['দশ হাজার', 'হাজার', 'শ', 'দশ', 'এক'][pos], val = digit * Math.pow(10, 4 - pos);
  return { p: `${bdg(n)} সংখ্যায় ${bd(digit)} এর স্থানীয় মান কত?`, ...pickNum(val, [digit, digit * 10, digit * 100, digit * 1000, digit * 10000, val * 10], (v) => bdg(v), 1), why: `${bd(digit)} আছে ${place}ের ঘরে (${place === 'এক' ? 'এককের' : place + 'ের'} ঘর), তাই এর মান ${bdg(val)}।` };
};
GEN.round = () => {
  const f = one([10, 100, 1000]);
  let n; do { n = R(1100, 9899); } while (n % f === f / 2);
  const ans = Math.round(n / f) * f;
  return { p: `${bdg(n)} কে কাছের ${bd(f)} এ গোল করো।`, ...pickNum(ans, [ans + f, ans - f, Math.floor(n / f) * f, Math.ceil(n / f) * f], (v) => bdg(v), 0), why: `ডান দিকের অঙ্ক ৫ বা বেশি হলে ওপরে ওঠে, কম হলে নিচে থাকে। ${bdg(n)} গোল হয় ${bdg(ans)}।` };
};
GEN.readbig = () => {
  const n = R(100, 999);
  return { p: 'এই অ্যাবাকাসে কত দেখানো হয়েছে?', show: abacus(n, 3), ...pickNum(n, [Number(String(n).split('').reverse().join('')), n + 100, n - 10, n + 1], bd, 0), why: `বাঁ থেকে ডানে শ, দশ, এক। সংখ্যা ${bd(n)}।` };
};

// ---- স্তর ১২: গুণ (বড় × এক অঙ্ক) ----
GEN.mulbig = () => {
  const a = R(12, 99), b = R(2, 9), p = a * b;
  return { p: `${bd(a)} ${MUL} ${bd(b)} = ?`, ...pickNum(p, [p + 10, p - 10, a + b, (a + 1) * b, (a - 1) * b], bd, 0), why: `${bd(Math.floor(a / 10) * 10)} ${MUL} ${bd(b)} = ${bd(Math.floor(a / 10) * 10 * b)} আর ${bd(a % 10)} ${MUL} ${bd(b)} = ${bd((a % 10) * b)}। যোগ করে ${bd(p)}।` };
};
GEN.mulword = () => {
  const price = R(12, 48), n = R(3, 9), p = price * n;
  return { p: `একটি কলমের দাম ${bd(price)} টাকা। ${bd(n)}টি কলমের দাম কত?`, ...pickNum(p, [p + price, p - price, price + n, p + 10], bd, 0), why: `${bd(price)} ${MUL} ${bd(n)} = ${bd(p)} টাকা।` };
};

// ---- স্তর ১৩: ভাগশেষ ----
GEN.rem = () => {
  const b = R(3, 9), q = R(4, 15), r = R(1, b - 1), a = b * q + r, askQ = rnd(2) === 0;
  const ans = askQ ? q : r;
  return { p: `${bd(a)} ${DIV} ${bd(b)} করলে ${askQ ? 'ভাগফল' : 'ভাগশেষ'} কত?`, ...pickNum(ans, askQ ? [r, q + 1, q - 1] : [q, r + 1, b - r, 0], bd, 0), why: `${bd(b)} ${MUL} ${bd(q)} = ${bd(b * q)}, ${bd(a)} − ${bd(b * q)} = ${bd(r)}। ভাগফল ${bd(q)}, ভাগশেষ ${bd(r)}।` };
};
GEN.remword = () => {
  const b = R(4, 8), q = R(3, 9), r = R(1, b - 1), a = b * q + r;
  return { p: `${bd(a)}টি ছাত্রকে ${bd(b)} জনের দলে ভাগ করা হলো। কয়টি পুরো দল হবে?`, ...pickNum(q, [q + 1, r, q - 1, a - b]), why: `${bd(a)} ${DIV} ${bd(b)} = ${bd(q)} ভাগশেষ ${bd(r)}। পুরো দল ${bd(q)}টি, ${bd(r)} জন বাকি।` };
};

// ---- স্তর ১৪: দশমিক ----
const dec = (t) => `${bd(Math.floor(t / 10))}.${bd(t % 10)}`;
GEN.decfrac = () => {
  const t = R(1, 9), w = R(0, 5);
  return { p: `${bd(w * 10 + t)}/${bd(10)} কে দশমিকে লিখলে?`, ...pickNum(w * 10 + t, [w * 10 + t + 1, t * 10 + w, w * 10 + t - 1, w * 100 + t], dec, 1), why: `হর ১০ হলে লবের শেষ অঙ্ক দশমিকের পরে বসে। ${dec(w * 10 + t)}।` };
};
GEN.decadd = () => {
  const a = R(11, 89), b = R(11, 89), s = a + b;
  return { p: `${dec(a)} + ${dec(b)} = ?`, ...pickNum(s, [s + 10, s - 10, s + 1, s - 1], dec, 0), why: `দশমিক বিন্দু সোজা রেখে যোগ করি: ${bd(a)} + ${bd(b)} = ${bd(s)} দশমাংশ = ${dec(s)}।` };
};
GEN.deccmp = () => {
  let a = R(11, 99), b = R(11, 99);
  while (a === b) b = R(11, 99);
  return { p: `কোনটি বড়: ${dec(a)} নাকি ${dec(b)}?`, ...pickStr(dec(Math.max(a, b)), [dec(Math.min(a, b)), 'দুটি সমান', 'বলা যায় না']), why: `আগে পূর্ণ অংশ, সমান হলে দশমাংশ দেখি। বড়টি ${dec(Math.max(a, b))}।` };
};
GEN.decmoney = () => {
  const t = R(12, 49), n = R(2, 6), p10 = t * n;
  return { p: `এক কেজি চিনির দাম ${dec(t)} টাকা (দশমিকে)। ${bd(n)} কেজির দাম কত?`, ...pickNum(p10, [p10 + 10, p10 - 10, p10 + 1, p10 - 1], dec, 1), why: `${dec(t)} ${MUL} ${bd(n)} = ${dec(p10)} টাকা।` };
};

// ---- স্তর ১৫: শতকরা ----
GEN.pctof = () => {
  let base, pct;
  do { base = one([40, 50, 80, 100, 120, 200, 240, 400, 500, 800]); pct = one([5, 10, 20, 25, 50, 75, 15, 30]); } while ((base * pct) % 100);
  const ans = base * pct / 100;
  return { p: `${bd(base)} এর ${bd(pct)}% কত?`, ...pickNum(ans, [base - ans, ans * 10, ans + pct, ans / 2 | 0], bd, 0), why: `${bd(pct)}% মানে ১০০ এ ${bd(pct)}। ${bd(base)} ${MUL} ${bd(pct)} ${DIV} ১০০ = ${bd(ans)}।` };
};
GEN.discount = () => {
  let price, pct;
  do { price = one([200, 250, 400, 500, 800, 1000, 1200, 2000]); pct = one([10, 20, 25, 30, 40, 50]); } while ((price * pct) % 100);
  const off = price * pct / 100, ans = price - off;
  return { p: `একটি জামার দাম ${bd(price)} টাকা। ${bd(pct)}% ছাড় পেলে কত টাকা দিতে হবে?`, ...pickNum(ans, [off, price + off, ans + 50, ans - 50], bd, 0), why: `ছাড় = ${bd(price)} এর ${bd(pct)}% = ${bd(off)} টাকা। দাম ${bd(price)} − ${bd(off)} = ${bd(ans)} টাকা।` };
};
GEN.profitpct = () => {
  let c, p;
  do { c = one([50, 80, 100, 200, 400, 500]); p = one([10, 20, 25, 50]); } while ((c * p) % 100);
  const s = c + c * p / 100;
  return { p: `${bd(c)} টাকায় কিনে ${bd(s)} টাকায় বিক্রি করলে শতকরা কত লাভ?`, ...pickNum(p, [p * 2, p + 10, s - c, p - 5].filter((x) => x > 0), (v) => `${bd(v)}%`, 1), why: `লাভ ${bd(s)} − ${bd(c)} = ${bd(s - c)} টাকা। শতকরা লাভ = ${bd(s - c)} ${DIV} ${bd(c)} ${MUL} ১০০ = ${bd(p)}%।` };
};

// ---- স্তর ১৬: অনুপাত ----
GEN.ratio = () => {
  let p, q;
  do { p = R(1, 7); q = R(1, 7); } while (gcd(p, q) !== 1 || p === q);
  const g = R(2, 9), a = p * g, b = q * g, ans = `${bd(p)}:${bd(q)}`;
  const wr = [`${bd(q)}:${bd(p)}`, `${bd(a)}:${bd(q)}`, `${bd(p)}:${bd(q + 1)}`, `${bd(p + 1)}:${bd(q)}`];
  return { p: `${bd(a)}:${bd(b)} কে সরলতম রূপে লেখো।`, ...pickStr(ans, wr), why: `দুটিকেই ${bd(g)} দিয়ে ভাগ করি: ${bd(a)} ${DIV} ${bd(g)} = ${bd(p)}, ${bd(b)} ${DIV} ${bd(g)} = ${bd(q)}।` };
};
GEN.share = () => {
  const p = R(1, 4), q = R(2, 5), k = R(2, 9), total = k * (p + q);
  return { p: `${bd(total)} টাকা ${bd(p)}:${bd(q)} অনুপাতে দুজনে ভাগ করল। যে বেশি পেল সে কত টাকা পেল?`, ...pickNum(k * Math.max(p, q), [k * Math.min(p, q), total / 2 | 0, k * (p + q - 1), k * Math.max(p, q) + k], bd, 0), why: `মোট ভাগ ${bd(p)} + ${bd(q)} = ${bd(p + q)}। এক ভাগ = ${bd(total)} ${DIV} ${bd(p + q)} = ${bd(k)}। বড় অংশ ${bd(Math.max(p, q))} ${MUL} ${bd(k)} = ${bd(k * Math.max(p, q))}।` };
};
GEN.unitary = () => {
  const u = R(5, 30), n1 = R(2, 6);
  let n2 = R(3, 12); while (n2 === n1) n2 = R(3, 12);
  const ans = u * n2;
  return { p: `${bd(n1)}টি খাতার দাম ${bd(u * n1)} টাকা। ${bd(n2)}টি খাতার দাম কত?`, ...pickNum(ans, [u * n1 + n2, ans + u, ans - u, u * n1 * n2 / n1 + 10], bd, 0), why: `একটির দাম = ${bd(u * n1)} ${DIV} ${bd(n1)} = ${bd(u)} টাকা। ${bd(n2)}টির দাম ${bd(u)} ${MUL} ${bd(n2)} = ${bd(ans)} টাকা।` };
};

// ---- স্তর ১৭, ১৮: সমীকরণ ----
GEN.eq1 = () => {
  const x = R(2, 20), a = R(2, 15), t = rnd(4);
  if (t === 0) return { p: `x + ${bd(a)} = ${bd(x + a)} হলে x = ?`, ...pickNum(x, [x + a, x + 1, x - 1, a], bd, 0), why: `দুই পাশ থেকে ${bd(a)} বাদ দিই: x = ${bd(x + a)} − ${bd(a)} = ${bd(x)}।` };
  if (t === 1) return { p: `x ${MINUS} ${bd(a)} = ${bd(x)} হলে x = ?`, ...pickNum(x + a, [x - a < 0 ? x + 2 : x - a, x + a + 1, x + a - 1, a], bd, 0), why: `দুই পাশে ${bd(a)} যোগ করি: x = ${bd(x)} + ${bd(a)} = ${bd(x + a)}।` };
  if (t === 2) { const m = R(2, 9); return { p: `${bd(m)}x = ${bd(m * x)} হলে x = ?`, ...pickNum(x, [m, x + 1, x - 1, m * x], bd, 0), why: `দুই পাশকে ${bd(m)} দিয়ে ভাগ করি: x = ${bd(m * x)} ${DIV} ${bd(m)} = ${bd(x)}।` }; }
  const m = R(2, 9);
  return { p: `x ${DIV} ${bd(m)} = ${bd(x)} হলে x = ?`, ...pickNum(x * m, [x + m, x, x * m + m, x * m - m], bd, 0), why: `দুই পাশকে ${bd(m)} দিয়ে গুণ করি: x = ${bd(x)} ${MUL} ${bd(m)} = ${bd(x * m)}।` };
};
GEN.eq2 = () => {
  const x = R(2, 15), a = R(2, 9), b = R(1, 20), plus = rnd(2) === 0;
  const c = plus ? a * x + b : a * x - b;
  if (!plus && c < 0) return GEN.eq2();
  return { p: `${bd(a)}x ${plus ? '+' : MINUS} ${bd(b)} = ${bd(c)} হলে x = ?`, ...pickNum(x, [x + 1, x - 1, (plus ? c - b : c + b), a], bd, 0), why: `আগে ${bd(b)} ${plus ? 'বাদ' : 'যোগ'} করি: ${bd(a)}x = ${bd(plus ? c - b : c + b)}। তারপর ${bd(a)} দিয়ে ভাগ: x = ${bd(x)}।` };
};
GEN.eqword = () => {
  const x = R(3, 14), a = R(2, 6), b = R(2, 12);
  return { p: `একটি সংখ্যার ${bd(a)} গুণের সাথে ${bd(b)} যোগ করলে ${bd(a * x + b)} হয়। সংখ্যাটি কত?`, ...pickNum(x, [x + 1, x - 1, a * x, a], bd, 0), why: `${bd(a)}x + ${bd(b)} = ${bd(a * x + b)}। ${bd(b)} বাদ দিলে ${bd(a)}x = ${bd(a * x)}। তাই x = ${bd(x)}।` };
};

// ---- স্তর ১৯: ঋণাত্মক সংখ্যা ----
GEN.intadd = () => {
  const a = R(-9, 9), b = R(-9, 9), s = a + b, t = rnd(2);
  const A = neg(a), B = b < 0 ? `(${neg(b)})` : bd(b);
  if (t === 0) return { p: `${A} + ${B} = ?`, ...pickNum(s, [-s, a - b, Math.abs(a) + Math.abs(b), s + 2, s - 2], neg), why: `সংখ্যারেখায় ${neg(a)} থেকে ${b >= 0 ? 'ডানে' : 'বামে'} ${bd(Math.abs(b))} ঘর গেলে ${neg(s)}।` };
  return { p: `${A} ${MINUS} ${B} = ?`, ...pickNum(a - b, [a + b, b - a, a - b + 2, a - b - 2], neg), why: `বিয়োগ মানে উল্টো চিহ্নের যোগ। ${A} + ${neg(-b) === '০' ? '০' : b < 0 ? bd(-b) : '(' + neg(-b) + ')'} = ${neg(a - b)}।` };
};
GEN.temp = () => {
  const start = R(-8, 6), drop = R(2, 12), ans = start - drop;
  return { p: `সকালে তাপমাত্রা ${neg(start)}°সে. ছিল। রাতে ${bd(drop)}° কমলে তাপমাত্রা কত হলো?`, ...pickNum(ans, [start + drop, -ans, drop - start, ans + 2], (v) => `${neg(v)}°সে.`), why: `${neg(start)} থেকে ${bd(drop)} ঘর বামে গেলে ${neg(ans)}।` };
};
GEN.intcmp = () => {
  let a = R(-12, 12), b = R(-12, 12);
  while (a === b) b = R(-12, 12);
  return { p: `কোনটি ছোট: ${neg(a)} নাকি ${neg(b)}?`, ...pickStr(neg(Math.min(a, b)), [neg(Math.max(a, b)), 'দুটি সমান', 'বলা যায় না']), why: `সংখ্যারেখায় যে বামে থাকে সেটি ছোট। ${neg(Math.min(a, b))} বামে।` };
};

// ---- স্তর ২০: সূচক ও বর্গমূল ----
GEN.pow = () => {
  const b = one([2, 3, 4, 5, 10]), e = b === 2 ? R(2, 8) : b === 10 ? R(2, 5) : R(2, 4), v = Math.pow(b, e);
  return { p: `${bd(b)}^${bd(e)} = ? (${bd(b)} কে ${bd(e)} বার গুণ)`, ...pickNum(v, [b * e, v * b, v / b, v + b], (x) => bdg(x), 1), why: `${Array(e).fill(bd(b)).join(` ${MUL} `)} = ${bdg(v)}।` };
};
GEN.sqrt = () => {
  const r = R(2, 15), v = r * r;
  return { p: `√${bd(v)} = ?`, ...pickNum(r, [r + 1, r - 1, v / 2 | 0, r * 2], bd, 1), why: `${bd(r)} ${MUL} ${bd(r)} = ${bd(v)}, তাই √${bd(v)} = ${bd(r)}।` };
};
GEN.sqword = () => {
  const r = R(3, 12);
  return { p: `একটি বর্গাকার ঘরের ক্ষেত্রফল ${bd(r * r)} বর্গমিটার। এক বাহু কত মিটার?`, ...pickNum(r, [r * 2, r + 1, r - 1, r * r / 2 | 0], bd, 1), why: `ক্ষেত্রফল = বাহু × বাহু। √${bd(r * r)} = ${bd(r)} মিটার।` };
};

// ---- স্তর ২১: ক্ষেত্রফল ও পরিসীমা ----
GEN.rectarea = () => {
  const w = R(3, 15), h = R(2, 12), askA = rnd(2) === 0, ans = askA ? w * h : 2 * (w + h);
  return { p: `আয়তক্ষেত্রটির ${askA ? 'ক্ষেত্রফল (বর্গ একক)' : 'পরিসীমা (একক)'} কত?`, show: rect(w, h), ...pickNum(ans, askA ? [2 * (w + h), w + h, ans + w, ans - h] : [w * h, w + h, ans + 2, ans - 2], bd, 1), why: askA ? `ক্ষেত্রফল = দৈর্ঘ্য × প্রস্থ = ${bd(w)} ${MUL} ${bd(h)} = ${bd(ans)}।` : `পরিসীমা = ২ × (${bd(w)} + ${bd(h)}) = ${bd(ans)}।` };
};
GEN.triarea = () => {
  const b = R(2, 12) * 2, h = R(3, 12), ans = b * h / 2;
  return { p: `একটি ত্রিভুজের ভূমি ${bd(b)} সেমি আর উচ্চতা ${bd(h)} সেমি। ক্ষেত্রফল কত বর্গ সেমি?`, ...pickNum(ans, [b * h, b + h, ans + b, ans - h], bd, 1), why: `ত্রিভুজের ক্ষেত্রফল = ½ × ভূমি × উচ্চতা = ½ × ${bd(b)} × ${bd(h)} = ${bd(ans)}।` };
};
GEN.field = () => {
  const w = R(5, 20), h = R(5, 20), cost = one([10, 20, 50]);
  return { p: `${bd(w)} মি. লম্বা আর ${bd(h)} মি. চওড়া মাঠে প্রতি বর্গমিটারে ${bd(cost)} টাকা খরচে ঘাস লাগাতে কত খরচ?`, ...pickNum(w * h * cost, [2 * (w + h) * cost, w * h, w * h * cost + cost * 10, (w + h) * cost], (v) => bdg(v), 1), why: `ক্ষেত্রফল ${bd(w)} ${MUL} ${bd(h)} = ${bd(w * h)} বর্গমিটার। খরচ ${bd(w * h)} ${MUL} ${bd(cost)} = ${bdg(w * h * cost)} টাকা।` };
};
GEN.circle = () => {
  const r = one([7, 14, 21]), c = 2 * 22 * r / 7;
  return { p: `বৃত্তের ব্যাসার্ধ ${bd(r)} সেমি হলে পরিধি কত সেমি? (π = ২২/৭)`, ...pickNum(c, [c / 2, c * 2, r * r * 22 / 7, c + r], bd, 1), why: `পরিধি = ২πr = ২ × ২২/৭ × ${bd(r)} = ${bd(c)} সেমি।` };
};

// ---- স্তর ২২: কোণ ও পিথাগোরাস ----
GEN.angle = () => {
  const a = R(30, 80), b = R(30, 90 - 5 + 40), c = 180 - a - b;
  if (c < 15) return GEN.angle();
  return { p: `একটি ত্রিভুজের দুটি কোণ ${bd(a)}° আর ${bd(b)}°। তৃতীয় কোণ কত?`, ...pickNum(c, [180 - a, 90 - a, 360 - a - b, c + 10], (v) => `${bd(v)}°`, 1), why: `ত্রিভুজের তিন কোণের সমষ্টি ১৮০°। ১৮০ − ${bd(a)} − ${bd(b)} = ${bd(c)}°।` };
};
const TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
GEN.pyth = () => {
  const [a, b, c0] = one(TRI), k = a <= 5 ? R(1, 4) : 1, A = a * k, B = b * k, C = c0 * k;
  if (rnd(2) === 0) return { p: `সমকোণী ত্রিভুজের দুই বাহু ${bd(A)} আর ${bd(B)}। অতিভুজ কত?`, show: rightTri(A, B), ...pickNum(C, [A + B, C + 1, C - 1, B - A], bd, 1), why: `${bd(A)}² + ${bd(B)}² = ${bd(A * A)} + ${bd(B * B)} = ${bd(C * C)}। √${bd(C * C)} = ${bd(C)}।` };
  return { p: `সমকোণী ত্রিভুজের অতিভুজ ${bd(C)} আর এক বাহু ${bd(A)}। অন্য বাহু কত?`, ...pickNum(B, [C - A, B + 1, B - 1, A + C], bd, 1), why: `${bd(C)}² − ${bd(A)}² = ${bd(C * C)} − ${bd(A * A)} = ${bd(B * B)}। √${bd(B * B)} = ${bd(B)}।` };
};
GEN.ladder = () => {
  const [a, b, c0] = one(TRI.slice(0, 2)), k = R(1, 2);
  return { p: `${bd(c0 * k)} মিটার লম্বা মই দেয়ালে হেলান দিয়ে আছে। মইয়ের গোড়া দেয়াল থেকে ${bd(a * k)} মি. দূরে। মই দেয়ালের কত উচ্চতায় ঠেকেছে?`, ...pickNum(b * k, [c0 * k - a * k, b * k + 1, a * k + c0 * k, b * k - 1], bd, 1), why: `উচ্চতা = √(${bd(c0 * k)}² − ${bd(a * k)}²) = √${bd(b * b * k * k)} = ${bd(b * k)} মিটার।` };
};

// ---- স্তর ২৩: পরিসংখ্যান ----
GEN.mean = () => {
  const n = one([4, 5]), m = R(8, 40), dev = [];
  let rest = 0;
  for (let i = 0; i < n - 1; i++) { const d = R(-6, 6); dev.push(d); rest += d; }
  dev.push(-rest);
  const xs = dev.map((d) => m + d);
  if (xs.some((x) => x <= 0)) return GEN.mean();
  return { p: `${xs.map(bd).join(', ')} এর গড় কত?`, ...pickNum(m, [m + 1, m - 1, Math.max(...xs), Math.min(...xs)], bd, 1), why: `যোগফল ${bd(xs.reduce((a, b) => a + b, 0))}, সংখ্যা ${bd(n)}টি। গড় = ${bd(xs.reduce((a, b) => a + b, 0))} ${DIV} ${bd(n)} = ${bd(m)}।` };
};
GEN.median = () => {
  const xs = new Set();
  while (xs.size < 5) xs.add(R(3, 40));
  const arr = shuffle([...xs]), s = [...xs].sort((a, b) => a - b), med = s[2];
  return { p: `${arr.map(bd).join(', ')} এর মধ্যমা কত?`, ...pickNum(med, [s[0], s[4], s[1], s[3]], bd, 1), why: `ছোট থেকে বড় সাজালে: ${s.map(bd).join(', ')}। ঠিক মাঝেরটি ${bd(med)}।` };
};
GEN.mode = () => {
  const m = R(2, 9);
  let o1 = R(2, 9); while (o1 === m) o1 = R(2, 9);
  let o2 = R(2, 9); while (o2 === m || o2 === o1) o2 = R(2, 9);
  const arr = shuffle([m, m, m, o1, o1, o2]);
  return { p: `${arr.map(bd).join(', ')} এর প্রচুরক (সবচেয়ে বেশিবার যা আছে) কত?`, ...pickNum(m, [o1, o2, m + 1, m - 1], bd, 1), why: `${bd(m)} আছে ৩ বার, বাকিগুলো কম। তাই প্রচুরক ${bd(m)}।` };
};

// ---- স্তর ২৪: সম্ভাবনা ----
GEN.prob = () => {
  const r = R(1, 6), b = R(1, 6), tot = r + b, g = gcd(r, tot);
  const ans = `${bd(r / g)}/${bd(tot / g)}`;
  const wr = [`${bd(b / gcd(b, tot))}/${bd(tot / gcd(b, tot))}`, `${bd(r)}/${bd(b)}`, `${bd(1)}/${bd(tot)}`, `${bd(r + 1)}/${bd(tot + 1)}`];
  const clean = wr.filter((x) => x !== ans);
  // সমান মানের ভগ্নাংশ বাদ
  const val = (s) => { const [x, y] = s.split('/').map((t) => +t.replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c))); return x / y; };
  const okw = clean.filter((x) => Math.abs(val(x) - r / tot) > 1e-9);
  const extra = [`${bd(tot)}/${bd(r)}`, `${bd(2)}/${bd(tot + 2)}`, `${bd(r)}/${bd(tot + 3)}`].filter((x) => Math.abs(val(x) - r / tot) > 1e-9);
  return { p: `একটি থলিতে ${bd(r)}টি লাল আর ${bd(b)}টি নীল বল আছে। না দেখে একটি তুললে লাল হওয়ার সম্ভাবনা কত?`, ...pickStr(ans, [...okw, ...extra]), why: `মোট বল ${bd(tot)}টি, লাল ${bd(r)}টি। সম্ভাবনা = ${bd(r)}/${bd(tot)}${g > 1 ? ` = ${ans}` : ''}।` };
};
GEN.dice = () => {
  const cases = [['জোড় সংখ্যা', 3], ['৪ এর বেশি সংখ্যা', 2], ['৬', 1], ['৩ এর চেয়ে ছোট সংখ্যা', 2], ['১ থেকে ৬ এর মধ্যে কোনো সংখ্যা', 6]];
  const [name, k] = one(cases), g = gcd(k, 6), ans = `${bd(k / g)}/${bd(6 / g)}`;
  const pool = ['১/২', '১/৩', '১/৬', '২/৩', '১/১', '৫/৬'].filter((x) => x !== (k === 6 ? '১/১' : ans));
  const right = k === 6 ? '১/১' : ans;
  return { p: `একটি পাশা ছুড়লে ${name} পড়ার সম্ভাবনা কত?`, ...pickStr(right, pool), why: `পাশার ৬টি পিঠের মধ্যে ${bd(k)}টি মেলে। সম্ভাবনা ${bd(k)}/৬${right !== `${bd(k)}/৬` ? ` = ${right}` : ''}।` };
};
GEN.coin = () => {
  const n = R(2, 3), ans = `১/${bd(Math.pow(2, n))}`;
  return { p: `একটি মুদ্রা ${bd(n)} বার ছুড়লে ${bd(n)} বারই হেড পড়ার সম্ভাবনা কত?`, ...pickStr(ans, ['১/২', '১/৪', '১/৮', '১/১৬', '১/৩'].filter((x) => x !== ans)), why: `প্রতিবার হেডের সম্ভাবনা ১/২। ${bd(n)} বার: ${Array(n).fill('১/২').join(` ${MUL} `)} = ${ans}।` };
};

// ---- স্তর ২৫: সুদ ----
GEN.simple = () => {
  const P = one([1000, 2000, 5000, 10000, 20000]), r = one([5, 8, 10, 12]), t = R(1, 4), I = P * r * t / 100;
  const askTotal = rnd(2) === 0, ans = askTotal ? P + I : I;
  return { p: `${bdg(P)} টাকা বছরে ${bd(r)}% সরল সুদে ${bd(t)} বছরের জন্য রাখলে ${askTotal ? 'মোট কত টাকা ফেরত পাওয়া যাবে' : 'সুদ কত হবে'}?`, ...pickNum(ans, askTotal ? [I, P + I * 2, P + I / 2 | 0, P + P * r / 100] : [I * 2, P * r / 100, I + P, I / 2 | 0], (v) => bdg(v), 1), why: `সুদ = আসল ${MUL} হার ${MUL} সময় ${DIV} ১০০ = ${bdg(P)} ${MUL} ${bd(r)} ${MUL} ${bd(t)} ${DIV} ১০০ = ${bdg(I)} টাকা।${askTotal ? ` মোট = ${bdg(P)} + ${bdg(I)} = ${bdg(P + I)}।` : ''}` };
};
GEN.compound = () => {
  const P = one([1000, 2000, 5000, 10000]), r = one([10, 20]), A = P * (100 + r) * (100 + r) / 10000, simple = P + P * r * 2 / 100;
  return { p: `${bdg(P)} টাকা বছরে ${bd(r)}% চক্রবৃদ্ধি সুদে ২ বছর রাখলে মোট কত হবে?`, ...pickNum(A, [simple, A + P / 10, P + P * r / 100, A - 100].filter((x) => x !== A), (v) => bdg(v), 1), why: `১ম বছরে ${bdg(P)} হয় ${bdg(P * (100 + r) / 100)}। ২য় বছরে সেই টাকার ওপর সুদ, তাই ${bdg(A)}। সরল সুদে হতো ${bdg(simple)}, চক্রবৃদ্ধিতে ${bdg(A - simple)} টাকা বেশি।` };
};

// ---- স্তর ২৬: রেখা ও ঢাল ----
const lin = (m, c) => `${m === 1 ? '' : m === -1 ? '−' : neg(m)}x ${c < 0 ? MINUS : '+'} ${bd(Math.abs(c))}`;
GEN.line = () => {
  const m = R(-4, 5) || 2, c = R(-6, 9), x = R(-3, 5), y = m * x + c;
  return { p: `y = ${lin(m, c)} হলে x = ${neg(x)} এ y কত?`, ...pickNum(y, [m * x - c, m + x + c, -y, y + m], neg), why: `x এর জায়গায় ${neg(x)} বসাই: ${neg(m)} ${MUL} ${x < 0 ? '(' + neg(x) + ')' : bd(x)} ${c < 0 ? MINUS : '+'} ${bd(Math.abs(c))} = ${neg(y)}।` };
};
GEN.slope = () => {
  const m = R(-4, 5) || 3, x1 = R(-3, 3), c = R(-5, 5), dx = R(1, 4), x2 = x1 + dx, y1 = m * x1 + c, y2 = m * x2 + c;
  return { p: `রেখাটি (${neg(x1)}, ${neg(y1)}) আর (${neg(x2)}, ${neg(y2)}) বিন্দু দিয়ে যায়। রেখার ঢাল কত?`, ...pickNum(m, [-m, m + 1, m - 1, dx], neg), why: `ঢাল = y এর পরিবর্তন ${DIV} x এর পরিবর্তন = (${neg(y2)} ${MINUS} ${y1 < 0 ? '(' + neg(y1) + ')' : bd(y1)}) ${DIV} ${bd(dx)} = ${neg(m)}।` };
};
GEN.intercept = () => {
  const m = R(1, 5), c = R(-8, 9);
  return { p: `y = ${lin(m, c)} রেখা y অক্ষকে কোন বিন্দুতে কাটে? (y-ছেদক কত?)`, ...pickNum(c, [m, -c, m + c, c + 1], neg), why: `x = ০ বসালে y = ${neg(c)}। এটিই y-ছেদক। এখানে ঢাল ${bd(m)}।` };
};
GEN.taxi = () => {
  const base = R(2, 6) * 10, per = R(1, 4) * 5, km = R(3, 12);
  return { p: `একটি রাইড-শেয়ারের ভাড়া: শুরুতেই ${bd(base)} টাকা, তারপর প্রতি কিমিতে ${bd(per)} টাকা। ${bd(km)} কিমি যেতে কত ভাড়া?`, ...pickNum(base + per * km, [(base + per) * km, base * km + per, per * km, base + per + km], bd, 1), why: `ভাড়া y = ${bd(per)}x + ${bd(base)}, যেখানে x কিমি। ${bd(per)} ${MUL} ${bd(km)} + ${bd(base)} = ${bd(base + per * km)} টাকা।` };
};

// ---- স্তর ২৭: দ্বিঘাত সমীকরণ ----
const sgn = (v) => (v < 0 ? `${MINUS} ${bd(-v)}` : `+ ${bd(v)}`);
const quad = (a, b) => {
  const S = -(a + b), P = a * b;
  const mid = S === 0 ? '' : ` ${sgn(S)}${'x'}`.replace(/(\d)x$/, '$1x');
  const mid2 = S === 0 ? '' : ` ${S < 0 ? MINUS : '+'} ${Math.abs(S) === 1 ? '' : bd(Math.abs(S))}x`;
  const end = P === 0 ? '' : ` ${P < 0 ? MINUS : '+'} ${bd(Math.abs(P))}`;
  return `x²${mid2}${end} = ০`;
};
GEN.quadroot = () => {
  let a, b;
  do { a = R(-6, 9); b = R(-6, 9); } while (a === b || a === 0 || b === 0);
  const hi = Math.max(a, b), lo = Math.min(a, b), askHi = rnd(2) === 0;
  const ans = askHi ? hi : lo;
  return { p: `${quad(a, b)} সমীকরণের ${askHi ? 'বড়' : 'ছোট'} মূলটি কত?`, ...pickNum(ans, [-ans, askHi ? lo : hi, a + b, a * b], neg), why: `(x ${a < 0 ? '+' : MINUS} ${bd(Math.abs(a))})(x ${b < 0 ? '+' : MINUS} ${bd(Math.abs(b))}) = ০ আকারে ভাঙি। মূল দুটি ${neg(a)} আর ${neg(b)}।` };
};
GEN.quadsum = () => {
  let a, b;
  do { a = R(1, 9); b = R(1, 9); } while (a === b);
  const askS = rnd(2) === 0, ans = askS ? a + b : a * b;
  return { p: `${quad(a, b)} সমীকরণের মূল দুটির ${askS ? 'যোগফল' : 'গুণফল'} কত?`, ...pickNum(ans, askS ? [a * b, a - b, a + b + 1] : [a + b, a * b + 1, a * b - 1], bd, 0), why: `মূল দুটি ${bd(a)} আর ${bd(b)}। ${askS ? `যোগফল ${bd(a)} + ${bd(b)}` : `গুণফল ${bd(a)} ${MUL} ${bd(b)}`} = ${bd(ans)}।` };
};
GEN.areaeq = () => {
  const w = R(3, 9), extra = R(2, 5), area = w * (w + extra);
  return { p: `একটি আয়তক্ষেত্রের দৈর্ঘ্য প্রস্থের চেয়ে ${bd(extra)} মিটার বেশি। ক্ষেত্রফল ${bd(area)} বর্গমিটার। প্রস্থ কত মিটার?`, ...pickNum(w, [w + extra, w - 1, w + 1, extra], bd, 1), why: `প্রস্থ x হলে x(x + ${bd(extra)}) = ${bd(area)}। ${bd(w)} ${MUL} ${bd(w + extra)} = ${bd(area)}, তাই x = ${bd(w)}।` };
};

// ---- স্তর ২৮: ক্যালকুলাসের শুরু ----
const sup = (n) => ({ 2: '²', 3: '³', 4: '⁴' }[n]);
GEN.deriv = () => {
  const a = R(1, 5), n = R(2, 4), x = R(1, 3), ans = a * n * Math.pow(x, n - 1);
  return { p: `f(x) = ${a === 1 ? '' : bd(a)}x${sup(n)} হলে f′(${bd(x)}) কত? (f′ মানে পরিবর্তনের হার)`, ...pickNum(ans, [a * Math.pow(x, n), a * n, ans + a, n * x], (v) => bdg(v), 0), why: `নিয়ম: ax${sup(n)} এর পরিবর্তনের হার = ${bd(a)} ${MUL} ${bd(n)} ${MUL} x^${bd(n - 1)}। x = ${bd(x)} বসালে ${bdg(ans)}।` };
};
GEN.speed = () => {
  const t = R(2, 9);
  return { p: `একটি বলের দূরত্ব s = t² মিটার (t সেকেন্ডে)। t = ${bd(t)} সেকেন্ডে তার গতি কত মি/সে? (গতি = s এর পরিবর্তনের হার)`, ...pickNum(2 * t, [t * t, t, 2 * t + 2, t + 2], bd, 1), why: `s = t² এর পরিবর্তনের হার ২t। t = ${bd(t)} হলে ২ × ${bd(t)} = ${bd(2 * t)} মি/সে।` };
};
GEN.derivsum = () => {
  const b = R(2, 9), x = R(1, 4), ans = 2 * x + b;
  return { p: `f(x) = x² + ${bd(b)}x হলে f′(${bd(x)}) কত?`, ...pickNum(ans, [x * x + b * x, 2 * x, b, ans + 1], bd, 0), why: `x² এর হার ২x, ${bd(b)}x এর হার ${bd(b)}। f′(x) = ২x + ${bd(b)}। x = ${bd(x)} এ ${bd(ans)}।` };
};
GEN.derivconst = () => {
  const k = R(2, 20);
  return { p: `f(x) = ${bd(k)} (একটি ধ্রুব সংখ্যা) হলে তার পরিবর্তনের হার f′(x) কত?`, ...pickStr('০', [bd(k), '১', `${bd(k)}x`]), why: `ধ্রুব সংখ্যা কখনো বদলায় না, তাই পরিবর্তনের হার ০।` };
};

const L = (t, icon, band, cards, gens, vis) => ({ t, icon, band, cards, gens, vis });
// band: ১ = ৫-৭, ২ = ৮-১১, ৩ = ১২-১৫, ৪ = ১৬-২০ বছরের জন্য শুরুর জায়গা
export const MATH_LEVELS = [
  L('১০০ পর্যন্ত সংখ্যা', 'star', 1, ['দশটি এক মিলে হয় এক দশ। তাই ৩৭ মানে তিন দশ আর সাত এক।', 'দুই অঙ্কের সংখ্যায় বাঁ দিকের অঙ্কটি দশকের, ডান দিকেরটি এককের।', 'দুটি সংখ্যা তুলনা করতে আগে দশক দেখো। দশক সমান হলে একক দেখো।', 'অ্যাবাকাসে ওপরের পুঁতির মান ৫, নিচের প্রতিটির মান ১। বিমের দিকে সরানো পুঁতিগুলো গোনা হয়।'], ['place2', 'cmp2', 'expand', 'read']),
  L('যোগ: দুই অঙ্ক', 'apple', 1, ['আগে এককগুলো যোগ করো, তারপর দশকগুলো। ২৩ + ৪১: ৩ + ১ = ৪, ২ + ৪ = ৬, তাই ৬৪।', 'বার মডেলে পুরো সংখ্যাটি লম্বা দাগ, অংশগুলো তার ভাগ। কোনো অংশ জানা না থাকলে মোট থেকে বাদ দিলেই পাওয়া যায়।'], ['add2', 'partwhole', 'add2', 'partwhole']),
  L('যোগ: হাতে রাখা', 'jar', 1, ['এককের যোগফল ১০ বা বেশি হলে এক দশ হাতে রাখি। ২৭ + ১৫: ৭ + ৫ = ১২, ২ লিখি, ১ হাতে। দশকে ২ + ১ + ১ = ৪। উত্তর ৪২।', 'অ্যাবাকাসে এককের রডে ৯ এর পর আরেকটি যোগ করলে পুঁতি দশকের রডে এক ঘর উঠে যায়। এটিই হাতে রাখা।'], ['add2c', 'add2c', 'add2', 'partwhole']),
  L('বিয়োগ', 'drop', 1, ['যে সংখ্যা থেকে বিয়োগ করছি সেটি বড় সংখ্যা। ছোট সংখ্যাটি বাদ যাচ্ছে।', 'এককে বাদ না গেলে এক দশ ভেঙে দশটি এক বানাই। ৪২ − ১৮: ২ থেকে ৮ যায় না, তাই ১২ − ৮ = ৪। দশকে ৩ − ১ = ২। উত্তর ২৪।', 'যোগ আর বিয়োগ একে অপরের উল্টো। ২৪ + ১৮ = ৪২ মিললে বুঝবে বিয়োগ ঠিক আছে।'], ['sub2', 'sub2b', 'sub2b', 'partwhole']),
  L('নামতা ২, ৫, ১০', 'coin', 1, ['গুণ মানে একই সংখ্যা বারবার যোগ। ৫ × ৩ = ৫ + ৫ + ৫ = ১৫।', '২ এর নামতা: ২, ৪, ৬, ৮, ১০। ৫ এর নামতার শেষ অঙ্ক ৫ বা ০। ১০ এর নামতায় শুধু শেষে ০ বসাও।', 'জাপানে শিশুরা ৯ × ৯ পর্যন্ত নামতা ছন্দে মুখস্থ করে (কুকু)। চীনেও এটি ছড়ার মতো মুখস্থ করানো হয়। ঘুমানোর আগে একবার জোরে বললে মনে থাকে।'], ['t2510', 'skip', 't2510', 'arrays']),
  L('নামতা ৩, ৪', 'house', 1, ['৩ এর নামতা: ৩, ৬, ৯, ১২, ১৫। ৪ এর নামতা ৩ এর চেয়ে সহজে মনে রাখো: ৪ মানে ২ এর দ্বিগুণ।', 'যে নামতা ভুলে যাচ্ছ সেটি ভুলের খাতায় উঠবে। কয়েক দিন পরপর সেটি আবার জিজ্ঞেস করা হবে।'], ['t34', 'skip', 't34', 'arrays']),
  L('নামতা ৬ থেকে ৯', 'clock', 2, ['৬ থেকে ৯ এর নামতা কঠিন মনে হয়, কিন্তু অর্ধেক আগেই জানা। ৭ × ৩ আর ৩ × ৭ একই।', '৯ এর নামতার কৌশল: ৯ × ৪ = ৩৬, অঙ্ক দুটির যোগফল ৯। ৯ × ৭ = ৬৩, ৬ + ৩ = ৯।', 'এই স্তরে ঝটপট ছক খেলাটি খুব কাজে লাগে। প্রতিদিন কয়েক মিনিট, আর আগের সময়কে হারানোর চেষ্টা।'], ['t69', 't69', 'tmix', 'tmix']),
  L('ভাগ', 'fish', 2, ['ভাগ মানে সমান ভাগ করে দেওয়া। ১২টি আম ৩ জনকে দিলে প্রত্যেকে ৪টি পায়।', 'ভাগ হলো গুণের উল্টো। ৩ × ৪ = ১২ জানলে ১২ ÷ ৩ = ৪ আর ১২ ÷ ৪ = ৩ জানা হয়ে যায়।'], ['div', 'divword', 'div', 'divword']),
  L('ভগ্নাংশ', 'sun', 2, ['একটি জিনিসকে সমান ভাগ করে কিছু ভাগ নিলে হয় ভগ্নাংশ। ৪ ভাগের ১ ভাগ লিখি ১/৪।', 'নিচের সংখ্যা হর (কত ভাগ), ওপরেরটি লব (কত ভাগ নিলাম)।', 'হর সমান হলে যার লব বড় সেটি বড়। দুই-চার ভাগ বেশি মানেই বেশি অংশ।', '১/২ আর ২/৪ একই অংশ। লব আর হর একই সংখ্যা দিয়ে গুণ করলে ভগ্নাংশের মান বদলায় না।'], ['fracpie', 'fracof', 'fraccmp', 'fracequiv']),
  L('সময় ও মাপ', 'clock', 2, ['১ ঘণ্টা = ৬০ মিনিট। ১ মিটার = ১০০ সেমি। ১ কেজি = ১০০০ গ্রাম। ১ লিটার = ১০০০ মিলিলিটার।', 'বড় এককে থেকে ছোট এককে গেলে গুণ করি, উল্টো হলে ভাগ করি।', 'সময়ের হিসাবে ঘণ্টা পার হলে ৬০ মিনিট একটি ঘণ্টা হয়।'], ['timeadd', 'unit', 'timeadd', 'unit']),
  L('বড় সংখ্যা ও গোল করা', 'chart', 2, ['বাংলাদেশে বড় সংখ্যা লেখা হয় এভাবে: শেষ তিন অঙ্কের পর কমা, তারপর দুই অঙ্ক করে। ১২,৩৪,৫৬৭ (বারো লাখ চৌত্রিশ হাজার...)।', 'প্রতিটি অঙ্কের ঘর আছে: এক, দশ, শ, হাজার, দশ হাজার। অঙ্কের মান তার ঘরের ওপর নির্ভর করে।', 'গোল করতে ডান পাশের অঙ্ক দেখো। ৫ বা বেশি হলে ওপরে উঠবে, ৪ বা কম হলে নিচে থাকবে। ৩,৪৫৭ কে শতকে গোল করলে ৩,৫০০।'], ['bigplace', 'round', 'readbig', 'round']),
  L('গুণ: বড় সংখ্যা', 'shop', 3, ['১২ × ৩ কে ভাঙো: ১০ × ৩ = ৩০ আর ২ × ৩ = ৬। যোগ করে ৩৬।', 'দোকানে একটির দাম জানলে অনেকগুলোর দাম গুণ দিয়ে বের করা যায়। এটাই গুণের সবচেয়ে বেশি ব্যবহার।'], ['mulbig', 'mulword', 'mulbig', 'mulword']),
  L('ভাগশেষ', 'jar', 3, ['সব সময় ভাগ মিলে যায় না। ১৭ ÷ ৫ = ৩ আর বাকি থাকে ২। এই বাকিটাকে ভাগশেষ বলে।', 'ভাগশেষ সবসময় ভাজকের চেয়ে ছোট হয়। ভাজক ৫ হলে ভাগশেষ ০ থেকে ৪ এর মধ্যে।', 'ভাগফল × ভাজক + ভাগশেষ = ভাজ্য। এভাবে নিজের উত্তর যাচাই করা যায়।'], ['rem', 'remword', 'rem', 'remword']),
  L('দশমিক', 'drop', 3, ['১/১০ কে দশমিকে লিখি ০.১। ৩/১০ = ০.৩। দশমিক বিন্দুর পরের ঘর দশমাংশের।', 'যোগ করার সময় দশমিক বিন্দু একটির নিচে আরেকটি রাখো।', 'তুলনা করতে আগে পূর্ণ অংশ দেখো। সমান হলে দশমাংশ। ৩.৭ বড় ৩.২ এর চেয়ে।'], ['decfrac', 'decadd', 'deccmp', 'decadd']),
  L('শতকরা', 'coin', 3, ['শতকরা মানে প্রতি ১০০ তে। ২৫% মানে ১০০ তে ২৫, অর্থাৎ ১/৪ অংশ।', 'ছাড়ের হিসাব: আগে ছাড়ের টাকা বের করো, তারপর দাম থেকে বাদ দাও।', 'লাভ বের করো: বিক্রয়মূল্য − ক্রয়মূল্য। শতকরা লাভ = লাভ ÷ ক্রয়মূল্য × ১০০। ব্যবসার প্রতিটি সিদ্ধান্তে এটি কাজে লাগে।'], ['pctof', 'discount', 'profitpct', 'discount']),
  L('অনুপাত ও সমানুপাত', 'chart', 3, ['অনুপাত দুটি জিনিসের তুলনা। ছেলে ৬ জন, মেয়ে ৪ জন হলে অনুপাত ৬:৪, সরল করলে ৩:২।', 'একক নিয়মে আগে একটির মান বের করো, তারপর যতটি লাগে তত দিয়ে গুণ। ৩টি কলম ১৫ টাকা হলে একটি ৫ টাকা।', 'অনুপাতে ভাগ করতে মোট ভাগ সংখ্যা যোগ করো, মোট টাকাকে তা দিয়ে ভাগ করে এক ভাগ পাও।'], ['ratio', 'share', 'unitary', 'ratio']),
  L('অজানা খোঁজা (সমীকরণ)', 'sparkle', 3, ['সমীকরণ হলো দাঁড়িপাল্লার মতো। দুই পাশ সমান। এক পাশে কিছু করলে অন্য পাশেও তা করতে হবে।', 'x + ৫ = ১২ হলে দুই পাশ থেকে ৫ বাদ দাও। x = ৭।', 'গুণ থাকলে ভাগ করো, ভাগ থাকলে গুণ করো। উল্টো কাজ করে অজানাকে একা করো।'], ['eq1', 'eq1', 'eq1', 'eqword']),
  L('দুই ধাপের সমীকরণ', 'sparkle', 3, ['৩x + ৫ = ২০। প্রথমে ৫ বাদ দাও, ৩x = ১৫। তারপর ৩ দিয়ে ভাগ, x = ৫।', 'যোগ-বিয়োগ আগে সরাও, তারপর গুণ-ভাগ। ক্রম উল্টে গেলে ভুল হয়।', 'শব্দে লেখা সমস্যাকে x দিয়ে সমীকরণ বানিয়ে ফেললে অর্ধেক কাজ শেষ।'], ['eq2', 'eqword', 'eq2', 'eqword']),
  L('ঋণাত্মক সংখ্যা', 'moon', 3, ['০ এর বামে আছে ঋণাত্মক সংখ্যা: −১, −২, −৩। শীতের দেশে তাপমাত্রা শূন্যের নিচে নামে, ব্যাংকে ধার থাকলে হিসাব ঋণাত্মক হয়।', 'সংখ্যারেখায় ডানে গেলে বাড়ে, বামে গেলে কমে। −৫ + ৮ = ৩ (৫ ঘর ডানে গিয়ে ০ তে, আরও ৩ ঘর)।', 'বিয়োগ মানে উল্টো চিহ্নের যোগ। ৫ − (−৩) = ৫ + ৩ = ৮।'], ['intadd', 'temp', 'intcmp', 'intadd']),
  L('সূচক ও বর্গমূল', 'star', 3, ['২³ মানে ২ কে তিন বার গুণ: ২ × ২ × ২ = ৮। ছোট ওপরের সংখ্যাটি সূচক।', 'বর্গমূল হলো বর্গের উল্টো। ৫ × ৫ = ২৫ তাই √২৫ = ৫।', 'কম্পিউটারের হিসাব ২ এর সূচকে চলে (২, ৪, ৮, ১৬, ৩২...)। তাই এটি জানা দরকার।'], ['pow', 'sqrt', 'sqword', 'pow']),
  L('ক্ষেত্রফল ও পরিসীমা', 'house', 3, ['পরিসীমা মানে চারপাশের দৈর্ঘ্যের যোগফল (বেড়ার তারের মাপ)। ক্ষেত্রফল মানে ভেতরের জায়গা (ঘাস লাগানোর মাপ)।', 'আয়তক্ষেত্রের ক্ষেত্রফল = দৈর্ঘ্য × প্রস্থ। ত্রিভুজের ক্ষেত্রফল = ½ × ভূমি × উচ্চতা।', 'বৃত্তের পরিধি = ২πr, ক্ষেত্রফল = πr²। আমরা π = ২২/৭ ধরি।'], ['rectarea', 'triarea', 'field', 'circle']),
  L('কোণ ও পিথাগোরাস', 'shield', 4, ['ত্রিভুজের তিন কোণের সমষ্টি সবসময় ১৮০°।', 'সমকোণী ত্রিভুজে: অতিভুজ² = অন্য দুই বাহুর বর্গের যোগফল। ৩, ৪, ৫: ৯ + ১৬ = ২৫।', 'রাজমিস্ত্রি ৩-৪-৫ মাপ দিয়ে ঠিক সমকোণ বানায়। দেয়াল সোজা কিনা পরীক্ষা করার সহজ উপায়।'], ['angle', 'pyth', 'ladder', 'pyth']),
  L('গড়, মধ্যমা, প্রচুরক', 'chart', 4, ['গড় = সব সংখ্যার যোগফল ÷ সংখ্যা কয়টি। পরীক্ষার নম্বরের গড় দিয়ে নিজের অবস্থা বোঝা যায়।', 'মধ্যমা হলো ছোট থেকে বড় সাজালে ঠিক মাঝের সংখ্যা। মাঝখানে খুব বড় বা খুব ছোট সংখ্যা থাকলে মধ্যমা ভালো ছবি দেয়।', 'প্রচুরক হলো যে সংখ্যা সবচেয়ে বেশিবার আছে। দোকানি কোন মাপের জামা বেশি বিক্রি হয় জানতে এটি দেখে।'], ['mean', 'median', 'mode', 'mean']),
  L('সম্ভাবনা', 'sparkle', 4, ['সম্ভাবনা = যতগুলো উপায়ে ঘটনাটি ঘটে ÷ মোট সম্ভাব্য উপায়।', 'পাশা ছুড়লে ৬টি ফল সম্ভব। জোড় পড়ার উপায় ৩টি, তাই সম্ভাবনা ৩/৬ = ১/২।', 'সম্ভাবনা সবসময় ০ থেকে ১ এর মধ্যে। ০ মানে অসম্ভব, ১ মানে নিশ্চিত।', 'একটি ঘটনার পর আরেকটি ঘটনা ঘটলে সম্ভাবনা গুণ হয়।'], ['prob', 'dice', 'coin', 'prob']),
  L('সুদ ও চক্রবৃদ্ধি', 'coin', 4, ['সরল সুদ = আসল × হার × সময় ÷ ১০০। ঋণ নেওয়ার আগে এটি জানা সবচেয়ে জরুরি।', 'চক্রবৃদ্ধি সুদে প্রতি বছর সুদও আসলের সাথে যোগ হয়, তাই পরের বছরের সুদ বেশি হয়।', 'ঋণ নিলে চক্রবৃদ্ধি আপনার বিপক্ষে কাজ করে। আর জমা রাখলে বা বিনিয়োগ করলে আপনার পক্ষে, যত আগে শুরু তত লাভ।'], ['simple', 'compound', 'simple', 'compound']),
  L('রেখা ও ঢাল', 'chart', 4, ['y = mx + c একটি সরলরেখা। m হলো ঢাল (x এক বাড়লে y কত বাড়ে), c হলো y অক্ষে ছেদক।', 'ঢাল = (y২ − y১) ÷ (x২ − x১)। ঢাল ধনাত্মক হলে রেখা ওপরে ওঠে।', 'ট্যাক্সি ভাড়া, মোবাইলের বিল, বেতন: অনেক সম্পর্কই এই রেখার মতো। শুরুর খরচ হলো c, প্রতি এককের খরচ হলো m।'], ['line', 'slope', 'intercept', 'taxi']),
  L('দ্বিঘাত সমীকরণ', 'sparkle', 4, ['x² এর সমীকরণকে দ্বিঘাত বলে। এতে দুটি মূল থাকতে পারে।', '(x − ২)(x − ৩) = ০ হলে x = ২ অথবা x = ৩। কারণ গুণফল ০ হতে হলে একটি অংশ ০ হতেই হবে।', 'x² − ৫x + ৬ = ০ এ মূল দুটির যোগফল ৫ আর গুণফল ৬। যোগফল ও গুণফল মিলিয়ে মূল পাওয়া যায়।'], ['quadroot', 'quadsum', 'areaeq', 'quadroot']),
  L('ক্যালকুলাসের শুরু', 'star', 4, ['ক্যালকুলাস পরিবর্তনের হার মাপে। গাড়ি কত দ্রুত চলছে, কোম্পানি কত দ্রুত বাড়ছে, এটি তার ভাষা।', 'নিয়ম: ax^n এর পরিবর্তনের হার a × n × x^(n−1)। x² এর হার ২x। x³ এর হার ৩x²।', 'ধ্রুব সংখ্যার হার ০। দুই অংশ যোগ থাকলে আলাদা আলাদা করে হার বের করে যোগ করো।', 'প্রকৌশল, অর্থনীতি, কম্পিউটার বিজ্ঞান, ডেটা: সবখানে এই ধারণা দরকার হয়। এটি এখন শুধু সূচনা।'], ['deriv', 'speed', 'derivsum', 'derivconst'])
];

export const MATH_GEN = GEN;
