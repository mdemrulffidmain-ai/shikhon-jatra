// শব্দ, কম্পন ও আতশবাজি (confetti)
import { S } from './state.js';

let ac;
function tone(f, d, when = 0, type = 'sine', vol = 0.11) {
  if (!S.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type; o.frequency.value = f;
    const t = ac.currentTime + when;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + d + 0.02);
  } catch (e) { /* শব্দ না হলেও অ্যাপ চলবে */ }
}

const buzz = (ms) => { try { if (S.sound && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ঠিক আছে */ } };

export const sfx = {
  tap() { tone(520, 0.05, 0, 'triangle', 0.06); },
  ok() { tone(660, 0.12); tone(880, 0.2, 0.1); buzz(25); },
  bad() { tone(240, 0.28, 0, 'triangle', 0.1); buzz([40, 40, 40]); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, i * 0.12)); buzz(60); },
  flip() { tone(400, 0.08, 0, 'triangle'); tone(600, 0.1, 0.07, 'triangle'); }
};

// আতশবাজি
export function confetti(host = document.body) {
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = (c.width = innerWidth * dpr), H = (c.height = innerHeight * dpr);
  host.appendChild(c);
  const x = c.getContext('2d');
  const cols = ['#ffd23f', '#35d0ff', '#ff5fa2', '#3ddc84', '#8c6bff', '#ff8a3d'];
  const ps = Array.from({ length: 90 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35,
    vx: (Math.random() - 0.5) * 14 * dpr, vy: (-Math.random() * 14 - 4) * dpr,
    s: (5 + Math.random() * 7) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    c: cols[Math.floor(Math.random() * cols.length)]
  }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let f = 0;
  (function tick() {
    x.clearRect(0, 0, W, H);
    ps.forEach((p) => {
      p.vy += 0.38 * dpr; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6); x.restore();
    });
    if (++f < (reduce ? 8 : 110)) requestAnimationFrame(tick); else c.remove();
  })();
}
