// "আমার শিখন যাত্রা" এর একাউন্ট সার্ভার। বাইরের কোনো প্যাকেজ লাগে না, শুধু Node 20+।
// চালাতে: node server/server.mjs   (PORT, DATA_DIR, SECRET পরিবেশ চলক দিয়ে বদলানো যায়)
// সার্ভারে শুধু একাউন্ট আর শেখার অগ্রগতি থাকে। পিন, API কী বা ফোনের সময় কখনো আসে না।
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { merge } from '../src/lib/merge.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = +(process.env.PORT || 8787);
const DATA = process.env.DATA_DIR || path.join(here, 'data');
fs.mkdirSync(DATA, { recursive: true });
const DB = path.join(DATA, 'users.json');
const SECRET_FILE = path.join(DATA, 'secret.key');
const SECRET = process.env.SECRET || (fs.existsSync(SECRET_FILE) ? fs.readFileSync(SECRET_FILE, 'utf8') : (() => { const s = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_FILE, s, { mode: 0o600 }); return s; })());
const MAX_BODY = 600 * 1024;
const TOKEN_DAYS = 90;

let users = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, 'utf8')) : {};
let writing = false, dirty = false;
function persist() {
  if (writing) { dirty = true; return; }
  writing = true;
  const tmp = DB + '.tmp';
  fs.writeFile(tmp, JSON.stringify(users), { mode: 0o600 }, (e) => {
    if (!e) fs.rename(tmp, DB, () => { writing = false; if (dirty) { dirty = false; persist(); } });
    else { writing = false; }
  });
}

const b64 = (b) => Buffer.from(b).toString('base64url');
function sign(user) {
  const body = b64(JSON.stringify({ u: user, e: Date.now() + TOKEN_DAYS * 864e5 }));
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verify(tok) {
  if (!tok || !tok.includes('.')) return null;
  const [body, sig] = tok.split('.');
  const want = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.e > Date.now() ? p.u : null; } catch { return null; }
}
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

// ভুল পাসওয়ার্ডের চেষ্টা সীমিত করা: নামের জন্য ৮ বার, তারপর ১৫ মিনিট অপেক্ষা
const fails = new Map();
function locked(u) { const f = fails.get(u); return f && f.n >= 8 && Date.now() - f.t < 15 * 60e3; }
function fail(u) { const f = fails.get(u) || { n: 0, t: 0 }; fails.set(u, { n: f.n + 1, t: Date.now() }); }
const ipHits = new Map();
function tooMany(ip) {
  const now = Date.now(), h = (ipHits.get(ip) || []).filter((t) => now - t < 60e3);
  h.push(now); ipHits.set(ip, h);
  return h.length > 60;
}

const NAME = /^[a-z0-9_.-]{3,32}$/;
const send = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET, POST, PUT, OPTIONS', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
};
function body(req) {
  return new Promise((ok, no) => {
    let n = 0; const ch = [];
    req.on('data', (c) => { n += c.length; if (n > MAX_BODY) { if (n - c.length <= MAX_BODY) no(new Error('big')); } else ch.push(c); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(ch).toString() || '{}')); } catch { no(new Error('json')); } });
    req.on('error', no);
  });
}
// ক্লায়েন্টের পাঠানো তথ্য থেকে শুধু অনুমোদিত অংশ রাখা
import { pick } from '../src/lib/merge.js';
const clean = (s) => (s && typeof s === 'object' ? pick(s) : {});

export const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    const ip = req.socket.remoteAddress || '';
    if (tooMany(ip)) return send(res, 429, { err: 'busy' });
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/ping') return send(res, 200, { ok: true, app: 'shikhon' });

    if (req.method === 'POST' && (url.pathname === '/api/register' || url.pathname === '/api/login')) {
      const b = await body(req);
      const u = String(b.user || '').trim().toLowerCase(), pw = String(b.pass || '');
      if (!NAME.test(u)) return send(res, 400, { err: 'name' });
      if (pw.length < 6 || pw.length > 100) return send(res, 400, { err: 'pass' });
      if (url.pathname === '/api/register') {
        if (users[u]) return send(res, 409, { err: 'taken' });
        if (Object.keys(users).length >= 20000) return send(res, 503, { err: 'full' });
        const salt = crypto.randomBytes(16).toString('hex');
        users[u] = { salt, h: hash(pw, salt), made: Date.now(), state: clean(b.state), ts: Date.now() };
        persist();
        return send(res, 200, { token: sign(u), state: users[u].state });
      }
      if (locked(u)) return send(res, 429, { err: 'locked' });
      const rec = users[u];
      // একই সময় লাগানো যাতে নাম আছে কিনা বোঝা না যায়
      const h = hash(pw, rec ? rec.salt : '0'.repeat(32));
      if (!rec || !same(h, rec.h)) { fail(u); return send(res, 401, { err: 'bad' }); }
      fails.delete(u);
      return send(res, 200, { token: sign(u), state: rec.state });
    }

    if (url.pathname === '/api/sync' || url.pathname === '/api/me') {
      const u = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
      if (!u || !users[u]) return send(res, 401, { err: 'auth' });
      if (url.pathname === '/api/me' && req.method === 'GET') return send(res, 200, { user: u, made: users[u].made });
      if (req.method === 'GET') return send(res, 200, { state: users[u].state });
      if (req.method === 'PUT') {
        const b = await body(req);
        users[u].state = merge(users[u].state || {}, clean(b.state));
        users[u].ts = Date.now();
        persist();
        return send(res, 200, { state: users[u].state });
      }
    }
    if (url.pathname === '/api/delete' && req.method === 'POST') {
      const u = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
      if (!u || !users[u]) return send(res, 401, { err: 'auth' });
      const b = await body(req);
      if (!same(hash(String(b.pass || ''), users[u].salt), users[u].h)) return send(res, 401, { err: 'bad' });
      delete users[u]; persist();
      return send(res, 200, { ok: true });
    }
    send(res, 404, { err: 'none' });
  } catch (e) {
    send(res, e.message === 'big' ? 413 : 400, { err: e.message === 'big' ? 'big' : 'bad' });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => console.log(`শিখন সার্ভার চালু: http://localhost:${PORT}  (তথ্য: ${DATA})`));
}
export const _flush = () => new Promise((r) => { const t = setInterval(() => { if (!writing) { clearInterval(t); r(); } }, 5); });
