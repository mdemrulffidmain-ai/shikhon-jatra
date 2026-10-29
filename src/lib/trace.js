// হাতে লেখার ইঞ্জিন: অক্ষরের ছায়া আঁকা, আঙুলের দাগ নেওয়া, মেলানো।
// কঠিনতা ধাপে ধাপে বাড়ে: 1 = মোটা দাগ, 2 = বিন্দু দাগ, 3 = শুধু মনে রেখে।
const W = 320;
const FONT = '"Baloo Da 2","Hind Siliguri","Noto Sans Bengali",system-ui,sans-serif';
const css = (n, d) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d;

export const STAGE_NAME = { 1: 'মোটা দাগ', 2: 'বিন্দু দাগ', 3: 'মনে রেখে লেখো' };
const NEED = { 1: 0.5, 2: 0.45, 3: 0.4 };

function fit(ch) {
  const probe = document.createElement('canvas').getContext('2d');
  let size = 230;
  for (let t = 0; t < 10; t++) {
    probe.font = `800 ${size}px ${FONT}`;
    const m = probe.measureText(ch);
    const l = m.actualBoundingBoxLeft || 0;
    const r = m.actualBoundingBoxRight || m.width;
    const a = m.actualBoundingBoxAscent || size * 0.72;
    const d = m.actualBoundingBoxDescent || 0;
    const w = l + r, h = a + d;
    if (w > 244 || h > 244) { size *= 0.9; continue; }
    return { size, x: (W - w) / 2 + l, y: (W - h) / 2 + a };
  }
  return { size: 120, x: 90, y: 200 };
}

export async function createTrace(host, ch, stage) {
  host.innerHTML = '<canvas class="tc-g" width="320" height="320"></canvas><canvas class="tc-i" width="320" height="320" aria-label="লেখার জায়গা"></canvas>';
  const gc = host.querySelector('.tc-g');
  const ic = host.querySelector('.tc-i');
  const gx = gc.getContext('2d');
  const ix = ic.getContext('2d');
  try { await document.fonts.load(`800 200px "Baloo Da 2"`, ch); await document.fonts.load(`500 40px "Hind Siliguri"`, ch); } catch (e) { /* ফন্ট না এলেও চলবে */ }
  if (!host.isConnected) return null;

  const pos = fit(ch);
  const accent = css('--accent', '#6c5ce7');
  const ink = css('--ink', '#ff9f1c');
  const paint = (c) => { c.font = `800 ${pos.size}px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round'; };

  // মাপার জন্য অক্ষরের ছাপ
  const mk = document.createElement('canvas');
  mk.width = mk.height = W;
  const mx = mk.getContext('2d', { willReadFrequently: true });
  paint(mx); mx.fillStyle = '#000'; mx.fillText(ch, pos.x, pos.y);
  const glyph = mx.getImageData(0, 0, W, W).data;
  mx.clearRect(0, 0, W, W); paint(mx);
  mx.lineWidth = 34; mx.strokeStyle = '#000'; mx.strokeText(ch, pos.x, pos.y); mx.fillText(ch, pos.x, pos.y);
  const fat = mx.getImageData(0, 0, W, W).data;

  function guide(show) {
    gx.clearRect(0, 0, W, W);
    if (!show) return;
    paint(gx);
    if (stage === 1) {
      gx.globalAlpha = 0.3; gx.fillStyle = accent; gx.fillText(ch, pos.x, pos.y); gx.globalAlpha = 1;
      gx.setLineDash([2, 9]); gx.lineWidth = 3; gx.strokeStyle = accent; gx.strokeText(ch, pos.x, pos.y); gx.setLineDash([]);
    } else if (stage === 2) {
      gx.setLineDash([3, 9]); gx.lineWidth = 3.5; gx.strokeStyle = accent; gx.strokeText(ch, pos.x, pos.y); gx.setLineDash([]);
    } else {
      gx.globalAlpha = 0.28; gx.fillStyle = accent; gx.fillText(ch, pos.x, pos.y); gx.globalAlpha = 1;
    }
  }
  guide(true);

  let down = false, last = null;
  ix.lineWidth = 17; ix.lineCap = 'round'; ix.lineJoin = 'round'; ix.strokeStyle = ink; ix.fillStyle = ink;
  const pt = (e) => { const r = ic.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * W / r.height }; };
  ic.addEventListener('pointerdown', (e) => {
    e.preventDefault(); down = true;
    try { ic.setPointerCapture(e.pointerId); } catch (x) { /* ঠিক আছে */ }
    last = pt(e); ix.beginPath(); ix.arc(last.x, last.y, 8.5, 0, 7); ix.fill();
  });
  ic.addEventListener('pointermove', (e) => {
    if (!down) return; e.preventDefault();
    const p = pt(e); ix.beginPath(); ix.moveTo(last.x, last.y); ix.lineTo(p.x, p.y); ix.stroke(); last = p;
  });
  const up = () => { down = false; };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => ic.addEventListener(n, up));

  return {
    guide,
    hideAfter(ms) { setTimeout(() => guide(false), ms); },
    peek() { guide(true); setTimeout(() => guide(false), 1500); },
    clear() { ix.clearRect(0, 0, W, W); },
    check() {
      const d = ix.getImageData(0, 0, W, W).data;
      let gT = 0, gH = 0, iT = 0, iI = 0;
      for (let p = 0; p < W * W; p++) {
        const on = d[p * 4 + 3] > 40;
        if (glyph[p * 4 + 3] > 128) { gT++; if (on) gH++; }
        if (on) { iT++; if (fat[p * 4 + 3] > 128) iI++; }
      }
      const cov = gT ? gH / gT : 0, pre = iT ? iI / iT : 0;
      if (iT < 500) return { ok: false, m: 'আগে অক্ষরের ওপর দিয়ে আঁকো।' };
      if (pre < 0.62) return { ok: false, m: 'দাগের ওপর দিয়ে আঁকো। মুছে আবার চেষ্টা করো।' };
      if (cov < NEED[stage]) return { ok: false, m: 'প্রায় হয়েছে! অক্ষরের পুরোটা আঁকো।' };
      return { ok: true, m: 'সুন্দর হয়েছে!' };
    }
  };
}
