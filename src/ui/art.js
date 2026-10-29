// ছবি ও আইকন: সব SVG, কোনো বাইরের ফাইল লাগে না, তাই ইন্টারনেট ছাড়াও চলে।
// এই ফাইলে শুধু স্ট্রিং তৈরি হয়, DOM ছোঁয়া হয় না।
import { bd } from '../lib/util.js';

const svg = (vb, inner, cls = '', label = '') =>
  `<svg class="${cls}" viewBox="${vb}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

// ---------- মাসকট ----------
const MOUTH = {
  happy: '<path d="M25 44q7 6 14 0" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
  cheer: '<path d="M24 42q8 11 16 0z" fill="#fff"/>',
  sad: '<path d="M26 47q6-5 12 0" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
};

export function mascot(mode, mood = 'happy', cls = '') {
  if (mode === 'teen') {
    const eyes = mood === 'cheer' ? '<path d="M20 29q4-5 8 0M36 29q4-5 8 0" stroke="var(--on)" stroke-width="3" fill="none" stroke-linecap="round"/>' : '<circle cx="24" cy="29" r="3.4" fill="var(--on)"/><circle cx="40" cy="29" r="3.4" fill="var(--on)"/>';
    const mouth = mood === 'sad' ? '<path d="M25 45q7-6 14 0" stroke="var(--on)" stroke-width="3" fill="none" stroke-linecap="round"/>' : '<path d="M25 41q7 7 14 0" stroke="var(--on)" stroke-width="3" fill="none" stroke-linecap="round"/>';
    return svg('0 0 64 64', `<circle cx="32" cy="32" r="27" fill="var(--accent)"/><path d="M32 5a27 27 0 0 1 0 54z" fill="var(--accent2)" opacity=".35"/>${eyes}${mouth}<path d="M14 18l6 4M50 18l-6 4" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"/>`, 'mascot ' + cls);
  }
  if (mode === 'girl') {
    const eyes = mood === 'cheer'
      ? '<path d="M27 30q2-3 4 0M33 30q2-3 4 0" stroke="#4b2a63" stroke-width="2" fill="none" stroke-linecap="round"/>'
      : '<circle cx="28.5" cy="30" r="2.2" fill="#4b2a63"/><circle cx="35.5" cy="30" r="2.2" fill="#4b2a63"/>';
    const mouth = mood === 'sad'
      ? '<path d="M29 40q3-3 6 0" stroke="#4b2a63" stroke-width="2" fill="none" stroke-linecap="round"/>'
      : '<path d="M29 38q3 3 6 0" stroke="#4b2a63" stroke-width="2" fill="none" stroke-linecap="round"/>';
    return svg('0 0 64 64', `
      <ellipse cx="17" cy="22" rx="14" ry="16" fill="var(--accent)"/>
      <ellipse cx="47" cy="22" rx="14" ry="16" fill="var(--accent)"/>
      <ellipse cx="19" cy="46" rx="10" ry="11" fill="var(--accent2)"/>
      <ellipse cx="45" cy="46" rx="10" ry="11" fill="var(--accent2)"/>
      <circle cx="16" cy="20" r="4.5" fill="#fff" fill-opacity=".55"/><circle cx="48" cy="20" r="4.5" fill="#fff" fill-opacity=".55"/>
      <ellipse cx="32" cy="35" rx="9.5" ry="17" fill="#ffe3f1"/>
      ${eyes}${mouth}
      <circle cx="25.5" cy="35" r="2" fill="#ff8ab8" opacity=".6"/><circle cx="38.5" cy="35" r="2" fill="#ff8ab8" opacity=".6"/>
      <path d="M28 19q-3-9-9-10M36 19q3-9 9-10" stroke="#4b2a63" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="19" cy="9" r="2.2" fill="var(--gold)"/><circle cx="45" cy="9" r="2.2" fill="var(--gold)"/>`, 'mascot ' + cls);
  }
  const eyes = mood === 'cheer'
    ? '<path d="M20 30q4-6 8 0M36 30q4-6 8 0" stroke="#10163f" stroke-width="3" fill="none" stroke-linecap="round"/>'
    : '<circle cx="25" cy="30" r="4.4" fill="#10163f"/><circle cx="39" cy="30" r="4.4" fill="#10163f"/><circle cx="26.5" cy="28.5" r="1.4" fill="#fff"/><circle cx="40.5" cy="28.5" r="1.4" fill="#fff"/>';
  return svg('0 0 64 64', `
    <path d="M32 13V6" stroke="var(--accent2)" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="5.5" r="4" fill="var(--gold)"/>
    <rect x="9" y="13" width="46" height="40" rx="15" fill="var(--accent)"/>
    <rect x="15" y="20" width="34" height="21" rx="10" fill="#fff"/>
    ${eyes}
    <rect x="23" y="41.5" width="18" height="9" rx="4.5" fill="#10163f" opacity="0"/>
    ${MOUTH[mood] || MOUTH.happy}
    <rect x="2.5" y="26" width="7" height="14" rx="3.5" fill="var(--accent2)"/><rect x="54.5" y="26" width="7" height="14" rx="3.5" fill="var(--accent2)"/>`, 'mascot ' + cls);
}

// ---------- পেছনের দৃশ্য ----------
const STARS = [[30,60,1.6],[90,140,1.2],[160,40,1.8],[250,110,1.3],[330,60,1.6],[370,170,1.2],[60,250,1.4],[210,230,1.8],[310,300,1.3],[120,360,1.5],[20,430,1.2],[350,420,1.6],[240,480,1.3],[80,540,1.8],[300,600,1.2],[170,660,1.5],[40,720,1.3],[360,740,1.6]];

export function scenery(mode) {
  if (mode === 'teen') return svg('0 0 400 800', '<defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--bg)"/><stop offset="1" stop-color="var(--card)"/></linearGradient></defs><rect width="400" height="800" fill="url(#tg)"/><circle cx="360" cy="90" r="120" fill="var(--accent)" opacity=".08"/><circle cx="30" cy="700" r="150" fill="var(--accent2)" opacity=".08"/>', 'scene', '');
  if (mode === 'girl') {
    return svg('0 0 400 800', `
      <defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdeaff"/><stop offset=".55" stop-color="#e5f3ff"/><stop offset="1" stop-color="#dcf7e8"/></linearGradient></defs>
      <rect width="400" height="800" fill="url(#gg)"/>
      <g fill="#fff" opacity=".9" class="drift"><ellipse cx="80" cy="90" rx="50" ry="18"/><ellipse cx="115" cy="78" rx="30" ry="16"/><ellipse cx="320" cy="170" rx="56" ry="19"/><ellipse cx="350" cy="156" rx="30" ry="15"/></g>
      <path d="M0 700q100-50 200-10t200-30V800H0z" fill="#c9f1d9"/>
      <path d="M0 740q120-40 230-5t170-20V800H0z" fill="#aee8c6"/>
      <g class="sway"><g fill="#ff7eb6"><circle cx="40" cy="745" r="9"/><circle cx="52" cy="738" r="9"/><circle cx="46" cy="728" r="9"/><circle cx="34" cy="734" r="9"/></g><circle cx="44" cy="737" r="5" fill="#ffd166"/><path d="M44 748v40" stroke="#4fb286" stroke-width="3"/></g>
      <g class="sway2"><g fill="#a78bfa"><circle cx="350" cy="760" r="8"/><circle cx="360" cy="753" r="8"/><circle cx="355" cy="744" r="8"/><circle cx="344" cy="750" r="8"/></g><circle cx="353" cy="752" r="4.5" fill="#ffd166"/><path d="M353 762v32" stroke="#4fb286" stroke-width="3"/></g>`, 'scene', '');
  }
  const stars = STARS.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" class="${i % 3 === 0 ? 'tw' : i % 3 === 1 ? 'tw2' : ''}"/>`).join('');
  return svg('0 0 400 800', `
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f33"/><stop offset=".6" stop-color="#161c5c"/><stop offset="1" stop-color="#262a7a"/></linearGradient></defs>
    <rect width="400" height="800" fill="url(#bg)"/>
    <g fill="#fff" opacity=".9">${stars}</g>
    <g class="drift" opacity=".55"><circle cx="66" cy="700" r="24" fill="#ff9f5a"/><ellipse cx="66" cy="700" rx="42" ry="9" fill="none" stroke="#ffd9a8" stroke-width="4" transform="rotate(-18 66 700)"/></g>
    <circle cx="348" cy="640" r="16" fill="#4ad0c0" opacity=".5"/><circle cx="343" cy="635" r="4" fill="#2ea99b" opacity=".6"/>
    <path d="M0 800v-60q80-30 160-10t240-30v100z" fill="#1b2168" opacity=".9"/>`, 'scene', '');
}

// ---------- আইকন ----------
const ICONS = {
  drop: '<path d="M24 5c8 10 13 16 13 24a13 13 0 0 1-26 0c0-8 5-14 13-24z" fill="var(--accent)"/><path d="M17 30a7 7 0 0 0 7 7" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>',
  sparkle: '<circle cx="17" cy="28" r="9" fill="var(--accent)" opacity=".85"/><circle cx="32" cy="18" r="7" fill="var(--accent2)"/><circle cx="33" cy="34" r="5" fill="var(--gold)"/><circle cx="14" cy="25" r="2.5" fill="#fff" opacity=".8"/>',
  apple: '<path d="M24 14c-6-5-16-2-16 9 0 9 6 18 12 18 2 0 3-1 4-1s2 1 4 1c6 0 12-9 12-18 0-11-10-14-16-9z" fill="var(--accent)"/><path d="M24 14c0-5 2-8 6-9" stroke="#6b4a2b" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M30 8c4-2 7 0 7 0s-2 4-7 3z" fill="var(--accent2)"/>',
  moon: '<path d="M30 6a19 19 0 1 0 12 30A15 15 0 0 1 30 6z" fill="var(--gold)"/>',
  shield: '<path d="M24 5l16 6v12c0 10-7 17-16 20C15 40 8 33 8 23V11z" fill="var(--accent)"/><path d="M16 24l6 6 11-12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  coin: '<circle cx="24" cy="24" r="18" fill="var(--gold)"/><circle cx="24" cy="24" r="12.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/><text x="24" y="31" text-anchor="middle" font-size="19" font-weight="800" fill="#fff" font-family="Baloo Da 2,sans-serif">৳</text>',
  book: '<path d="M6 10h15c2 0 3 1 3 3v26c0-2-1-3-3-3H6z" fill="var(--accent)"/><path d="M42 10H27c-2 0-3 1-3 3v26c0-2 1-3 3-3h15z" fill="var(--accent2)"/>',
  clock: '<circle cx="24" cy="24" r="18" fill="#fff" stroke="var(--accent)" stroke-width="5"/><path d="M24 13v11l8 5" stroke="var(--accent2)" stroke-width="4" fill="none" stroke-linecap="round"/>',
  tree: '<rect x="21" y="28" width="6" height="14" rx="2" fill="#8a5a2b"/><circle cx="24" cy="20" r="14" fill="var(--accent2)"/><circle cx="16" cy="26" r="8" fill="var(--accent2)"/><circle cx="32" cy="26" r="8" fill="var(--accent2)"/>',
  sun: '<circle cx="24" cy="24" r="9" fill="var(--gold)"/><g stroke="var(--gold)" stroke-width="3.5" stroke-linecap="round"><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4"/></g>',
  heart: '<path d="M24 41C6 28 7 11 17 11c4 0 7 3 7 5 0-2 3-5 7-5 10 0 11 17-7 30z" fill="var(--accent)"/>',
  leaf: '<path d="M8 40C8 18 22 8 40 8c0 20-10 32-30 32z" fill="var(--accent2)"/><path d="M10 38L28 20" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>',
  house: '<path d="M6 24L24 8l18 16v18H6z" fill="var(--accent)"/><rect x="19" y="28" width="10" height="14" rx="2" fill="var(--gold)"/>',
  fish: '<ellipse cx="22" cy="24" rx="15" ry="10" fill="var(--accent)"/><path d="M36 24l9-9v18z" fill="var(--accent2)"/><circle cx="15" cy="21" r="2.5" fill="#fff"/>',
  star: '<polygon points="24,4 30,18 45,19 33.5,29 37,44 24,36 11,44 14.5,29 3,19 18,18" fill="var(--gold)"/>',
  jar: '<rect x="12" y="8" width="24" height="6" rx="2" fill="var(--accent2)"/><path d="M13 14h22v23a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5z" fill="var(--accent)" fill-opacity=".3" stroke="var(--accent)" stroke-width="3"/><circle cx="21" cy="34" r="4" fill="var(--gold)"/><circle cx="29" cy="36" r="4" fill="var(--gold)"/>',
  chart: '<rect x="8" y="26" width="8" height="14" rx="2" fill="var(--accent2)"/><rect x="20" y="16" width="8" height="24" rx="2" fill="var(--accent)"/><rect x="32" y="8" width="8" height="32" rx="2" fill="var(--gold)"/>',
  shop: '<path d="M6 18l4-10h28l4 10z" fill="var(--accent)"/><rect x="9" y="18" width="30" height="22" fill="var(--accent2)" fill-opacity=".5"/><rect x="20" y="26" width="9" height="14" fill="var(--gold)"/>'
};
export const icon = (name, cls = 'ico') => svg('0 0 48 48', ICONS[name] || ICONS.star, cls);

// ছোট UI আইকন (currentColor)
const U = {
  map: '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z" fill="currentColor"/><path d="M9 4v14M15 6v14" stroke="var(--tab-cut,#0000)" stroke-width="1.5"/>',
  target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  cards: '<rect x="3" y="6" width="12" height="15" rx="3" fill="currentColor" opacity=".55" transform="rotate(-10 9 13)"/><rect x="9" y="3" width="12" height="15" rx="3" fill="currentColor" transform="rotate(8 15 10)"/>',
  user: '<circle cx="12" cy="8" r="4.6" fill="currentColor"/><path d="M3.5 21c0-5 3.8-7.2 8.5-7.2s8.5 2.2 8.5 7.2z" fill="currentColor"/>',
  flame: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 1 2 2 2 4 2-2 1-6 1-9z" fill="currentColor"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  mic: '<rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  pen: '<path d="M4 20l1-5L16 4l4 4L9 19z" fill="currentColor"/>',
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="3" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  left: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
  star: '<polygon points="12,2 15,9 22,9.6 16.7,14.3 18.4,21.6 12,17.8 5.6,21.6 7.3,14.3 2,9.6 9,9" fill="currentColor"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  redo: '<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  eraser: '<path d="M4 16l9-10 7 6-6 8H8z" fill="currentColor"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="3" fill="currentColor"/><circle cx="12" cy="18.5" r="1.4" fill="var(--card)"/>',
  gear: '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.6"/><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></g>'
};
export const ui = (name, cls = 'ui') => svg('0 0 24 24', U[name] || '', cls);

export const starIcon = (on = true, cls = 'st') =>
  svg('0 0 24 24', `<polygon points="12,2 15,9 22,9.6 16.7,14.3 18.4,21.6 12,17.8 5.6,21.6 7.3,14.3 2,9.6 9,9" fill="${on ? 'var(--gold)' : 'var(--line)'}"/>`, cls);

// ---------- গোনার জিনিস ----------
export function dotsHtml(n, cls = 'dots') {
  if (n === 0) return svg('0 0 120 60', '<circle cx="60" cy="30" r="22" fill="none" stroke="var(--fg-soft)" stroke-width="4" stroke-dasharray="6 7"/>', cls, 'শূন্য');
  const cols = 5, rows = Math.ceil(n / cols);
  let s = '';
  for (let k = 0; k < n; k++) s += `<circle cx="${14 + (k % cols) * 24}" cy="${14 + Math.floor(k / cols) * 24}" r="9.5" fill="${k % 2 ? 'var(--accent2)' : 'var(--accent)'}"/>`;
  return svg(`0 0 ${28 + 24 * (Math.min(n, cols) - 1)} ${28 + 24 * (rows - 1)}`, s, cls, bd(n) + 'টি');
}

// মুদ্রা: ১, ২, ৫ টাকা ছোট; ১০ টাকা নোট
export function coinHtml(v, cls = 'coin') {
  if (v >= 10) {
    return svg('0 0 80 44', `<rect x="2" y="3" width="76" height="38" rx="8" fill="#5fb487"/><rect x="7" y="8" width="66" height="28" rx="5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><circle cx="17" cy="22" r="6" fill="#fff" fill-opacity=".5"/><text x="48" y="31" text-anchor="middle" font-size="24" font-weight="800" fill="#fff" font-family="Baloo Da 2,sans-serif">${bd(v)}</text>`, cls + ' note', bd(v) + ' টাকা');
  }
  const r = v === 1 ? 22 : v === 2 ? 25 : 28;
  const col = v === 1 ? '#c9d2dc' : v === 2 ? '#e9b949' : '#d98f3a';
  return svg('0 0 64 64', `<circle cx="32" cy="32" r="${r}" fill="${col}"/><circle cx="32" cy="32" r="${r - 5}" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="2.5"/><text x="32" y="41" text-anchor="middle" font-size="26" font-weight="800" fill="#43301a" font-family="Baloo Da 2,sans-serif">${bd(v)}</text>`, cls, bd(v) + ' টাকা');
}

export const swatch = (c) => svg('0 0 64 64', `<circle cx="32" cy="32" r="26" fill="${c}" stroke="var(--line)" stroke-width="3"/>`, 'swatch');

export function ring(pct, size = 64, label = '') {
  const r = 26, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
  return svg('0 0 64 64', `<circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--line)" stroke-width="8"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--gold)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)"/>${label}`, 'ring');
}
