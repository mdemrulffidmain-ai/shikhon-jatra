// গণিতের ছবি: অ্যাবাকাস (জাপানি সরোবান), ভগ্নাংশের চাকা, বার মডেল (সিঙ্গাপুর ও সাংহাইয়ের পদ্ধতি), দশক-এককের ব্লক।
// "বাস্তব জিনিস → ছবি → সংখ্যা" এই ক্রমে শেখানোর জন্য। সব SVG, ইন্টারনেট লাগে না।
import { bd } from '../lib/util.js';

const wrap = (w, h, inner, label) => `<svg class="vis" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

// সরোবান: প্রতিটি রডে ওপরে ১টি পুঁতি (৫) আর নিচে ৪টি পুঁতি (১ করে)। পুঁতি বিমের দিকে সরলে গোনা হয়।
export function abacus(num, rods = 3) {
  const digits = String(num).padStart(rods, '0').slice(-rods).split('').map(Number);
  const W = rods * 52 + 24, H = 168;
  let g = `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="12" fill="var(--card2)" stroke="var(--line)" stroke-width="3"/>`;
  g += `<rect x="9" y="54" width="${W - 18}" height="7" rx="3" fill="var(--accent)"/>`;
  digits.forEach((d, i) => {
    const x = 12 + 26 + i * 52;
    g += `<rect x="${x - 2}" y="12" width="4" height="${H - 24}" rx="2" fill="var(--line)"/>`;
    const heavenOn = d >= 5, e = d % 5;
    g += `<ellipse cx="${x}" cy="${heavenOn ? 41 : 22}" rx="19" ry="9" fill="var(--gold)" stroke="#0004" stroke-width="1.5"/>`;
    for (let k = 0; k < 4; k++) {
      const y = k < e ? 72 + k * 19 : 72 + k * 19 + 22;
      g += `<ellipse cx="${x}" cy="${y}" rx="19" ry="9" fill="var(--accent2)" stroke="#0004" stroke-width="1.5"/>`;
    }
  });
  return wrap(W, H, g, `অ্যাবাকাসে সংখ্যা`);
}

// ভগ্নাংশের চাকা: d ভাগের n ভাগ রঙিন
export function pie(n, d) {
  const R = 52, cx = 60, cy = 60;
  let g = '';
  for (let k = 0; k < d; k++) {
    const a0 = (k / d) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const path = d === 1 ? `<circle cx="${cx}" cy="${cy}" r="${R}"` : `<path d="M${cx} ${cy}L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z"`;
    g += `${path} fill="${k < n ? 'var(--accent)' : 'var(--card2)'}" stroke="var(--line)" stroke-width="2.5"/>`;
  }
  return wrap(120, 120, g, `${d} ভাগের ${n} ভাগ রঙিন`);
}

// বার মডেল: অংশগুলো পাশাপাশি, ওপরে মোট। অজানা অংশ "?" দিয়ে দেখানো হয়।
export function bar(parts, total) {
  const W = 300, H = 92, x0 = 10, w = W - 20, sum = parts.reduce((a, p) => a + (typeof p === 'number' ? p : p.v), 0) || 1;
  let g = `<path d="M${x0} 22v-8h${w}v8" fill="none" stroke="var(--fg-soft)" stroke-width="2.5"/><text x="${W / 2}" y="12" text-anchor="middle" font-size="16" font-weight="700" fill="var(--fg)">${total}</text>`;
  let x = x0;
  parts.forEach((p, i) => {
    const v = typeof p === 'number' ? p : p.v, label = typeof p === 'number' ? bd(p) : p.l;
    const pw = (v / sum) * w;
    g += `<rect x="${x.toFixed(1)}" y="32" width="${pw.toFixed(1)}" height="46" rx="6" fill="${label === '?' ? 'var(--card2)' : i % 2 ? 'var(--accent2)' : 'var(--accent)'}" stroke="var(--line)" stroke-width="2.5" ${label === '?' ? 'stroke-dasharray="6 4"' : ''}/>`;
    g += `<text x="${(x + pw / 2).toFixed(1)}" y="61" text-anchor="middle" font-size="20" font-weight="800" fill="${label === '?' ? 'var(--fg)' : 'var(--on)'}">${label}</text>`;
    x += pw;
  });
  return wrap(W, H, g, 'বার মডেল');
}

// দশক ও একক: দশটির ডাঁটা আর একটি করে ঘর
export function blocks(n) {
  const tens = Math.floor(n / 10), ones = n % 10;
  const W = Math.max(120, tens * 22 + ones * 0 + 100), H = 100;
  let g = '';
  for (let t = 0; t < tens; t++) g += `<rect x="${8 + t * 22}" y="8" width="16" height="84" rx="4" fill="var(--accent)" stroke="var(--line)" stroke-width="2"/>`;
  const ox = 14 + tens * 22;
  for (let o = 0; o < ones; o++) g += `<rect x="${ox + (o % 5) * 18}" y="${o < 5 ? 8 : 30}" width="14" height="14" rx="3" fill="var(--accent2)" stroke="var(--line)" stroke-width="2"/>`;
  return wrap(Math.max(W, ox + 5 * 18 + 8), H, g, `${bd(tens)} দশ আর ${bd(ones)} এক`);
}

// ছোট রেখাচিত্র: আয়তক্ষেত্র, ত্রিভুজ (মাপ সহ)
export function rect(w, h) {
  const k = 150 / Math.max(w, h), rw = w * k, rh = h * k;
  const x = 30 + (150 - rw) / 2, y = 14 + (150 - rh) / 2;
  return wrap(210, 190, `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="var(--card2)" stroke="var(--accent)" stroke-width="4"/>
    <text x="${x + rw / 2}" y="${y - 6}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--fg)">${bd(w)}</text>
    <text x="${x + rw + 8}" y="${y + rh / 2 + 5}" font-size="16" font-weight="700" fill="var(--fg)">${bd(h)}</text>`, 'আয়তক্ষেত্র');
}
export function rightTri(a, b) {
  const k = 130 / Math.max(a, b), ta = a * k, tb = b * k;
  const x = 40, y = 20;
  return wrap(210, 190, `<path d="M${x} ${y}V${y + ta}H${x + tb}Z" fill="var(--card2)" stroke="var(--accent)" stroke-width="4" stroke-linejoin="round"/>
    <path d="M${x} ${y + ta - 14}h14v14" fill="none" stroke="var(--fg-soft)" stroke-width="2.5"/>
    <text x="${x - 8}" y="${y + ta / 2}" text-anchor="end" font-size="16" font-weight="700" fill="var(--fg)">${bd(a)}</text>
    <text x="${x + tb / 2}" y="${y + ta + 22}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--fg)">${bd(b)}</text>`, 'সমকোণী ত্রিভুজ');
}
