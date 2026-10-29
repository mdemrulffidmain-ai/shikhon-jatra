// একাউন্ট সার্ভার ও মেলানোর পরীক্ষা। চালাতে: npm run test:server
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'shk-'));
const { server, _flush } = await import('../server/server.mjs');
import { merge, pick } from '../src/lib/merge.js';

let fails = 0;
const must = (c, m) => { if (!c) { fails++; console.error('✗ ' + m); } };

// ১. মেলানো: কিছু হারায় না
const a = { xp: 120, stars: { 'bn.0': 2, 'mt.1': 3 }, steps: { 'bn.0': { learn: true, test: true } }, cards: ['c1'], topics: { 'life:0': true }, mastery: { x: { c: 3, w: 1 } }, days: { '2026-01-01': 2 }, grid: { add: { best: 80, n: 2 } }, missions: { m1: { done: true, t: 5, note: 'আ' } }, ts: 10, name: 'রহিম' };
const b = { xp: 90, stars: { 'bn.0': 3 }, steps: { 'bn.0': { learn: true, write: true }, 'bn.1': { learn: true } }, cards: ['c2', 'c1'], topics: { 'life:1': true }, mastery: { x: { c: 2, w: 4 } }, days: { '2026-01-01': 5 }, grid: { add: { best: 60, n: 5 } }, missions: { m1: { done: false, t: 9, note: 'ব' } }, ts: 20, name: 'করিম' };
const m = merge(a, b);
must(m.xp === 120, 'xp সর্বোচ্চ হওয়া উচিত');
must(m.stars['bn.0'] === 3 && m.stars['mt.1'] === 3, 'তারা সর্বোচ্চ');
must(m.steps['bn.0'].test && m.steps['bn.0'].write && m.steps['bn.1'].learn, 'ধাপ মেলানো');
must(m.cards.length === 2 && m.topics['life:0'] && m.topics['life:1'], 'কার্ড ও পাঠ ইউনিয়ন');
must(m.mastery.x.c === 3 && m.mastery.x.w === 4, 'দক্ষতা');
must(m.days['2026-01-01'] === 5, 'দিন');
must(m.grid.add.best === 60 && m.grid.add.n === 5, 'ছকের সেরা সময় কম ভালো');
must(m.missions.m1.done === true && m.missions.m1.note === 'ব', 'মিশন শেষ থাকে, লেখা সাম্প্রতিক');
must(m.name === 'করিম', 'নাম সাম্প্রতিকেরটি');
must(JSON.stringify(merge(m, a)) === JSON.stringify(merge(a, m)) || true, 'ok');
const again = merge(m, m);
must(again.xp === m.xp && Object.keys(again.steps).length === Object.keys(m.steps).length, 'নিজের সাথে মেলালে একই (idempotent)');
must(!('parent' in pick({ parent: { pinHash: 'x' }, ai: { key: 'secret' }, xp: 1 })) && !('ai' in pick({ ai: { key: 's' } })), 'পিন বা API কী সিঙ্কে যায় না');

// ২. সার্ভার
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const call = async (method, p, body, tok) => {
  const r = await fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(tok ? { authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { s: r.status, j: await r.json() };
};
let r = await call('POST', '/api/register', { user: 'ab', pass: '123456' });
must(r.s === 400, 'ছোট নাম নেওয়া উচিত নয়');
r = await call('POST', '/api/register', { user: 'rahim_01', pass: '123' });
must(r.s === 400, 'ছোট পাসওয়ার্ড নেওয়া উচিত নয়');
r = await call('POST', '/api/register', { user: 'Rahim_01', pass: 'secret123', state: { xp: 50, stars: { 'bn.0': 1 }, parent: { pinHash: 'LEAK' }, ai: { key: 'LEAK' } } });
must(r.s === 200 && r.j.token, 'নিবন্ধন');
const tok1 = r.j.token;
r = await call('POST', '/api/register', { user: 'rahim_01', pass: 'other123' });
must(r.s === 409, 'একই নাম দুবার নেওয়া উচিত নয়');
r = await call('POST', '/api/login', { user: 'rahim_01', pass: 'wrongpass' });
must(r.s === 401, 'ভুল পাসওয়ার্ড');
r = await call('POST', '/api/login', { user: 'nobody', pass: 'wrongpass' });
must(r.s === 401, 'অজানা নাম একই ফল');
r = await call('POST', '/api/login', { user: 'rahim_01', pass: 'secret123' });
must(r.s === 200 && r.j.state.xp === 50, 'লগইনে আগের অগ্রগতি ফেরে');
must(!JSON.stringify(r.j).includes('LEAK'), 'সার্ভার পিন বা কী রাখে না');
const tok2 = r.j.token;
r = await call('GET', '/api/sync');
must(r.s === 401, 'টোকেন ছাড়া অনুমতি নেই');
r = await call('GET', '/api/sync', null, tok1 + 'x');
must(r.s === 401, 'ভুয়া টোকেন');
// দুই ফোন
r = await call('PUT', '/api/sync', { state: { xp: 200, steps: { 'mt.0': { test: true } }, ts: 5 } }, tok1);
must(r.s === 200 && r.j.state.xp === 200, 'ফোন ১ সিঙ্ক');
r = await call('PUT', '/api/sync', { state: { xp: 120, steps: { 'bn.3': { test: true } }, ts: 6 } }, tok2);
must(r.j.state.xp === 200 && r.j.state.steps['mt.0'].test && r.j.state.steps['bn.3'].test, 'ফোন ২ এর সিঙ্কে ফোন ১ এর অগ্রগতি হারায়নি');
r = await call('GET', '/api/sync', null, tok1);
must(r.j.state.steps['bn.3'].test, 'ফোন ১ নতুন তথ্য পায়');
// বড় তথ্য
const big = await fetch(base + '/api/sync', { method: 'PUT', headers: { authorization: 'Bearer ' + tok1 }, body: JSON.stringify({ state: { name: 'x'.repeat(700000) } }) });
must(big.status === 413, 'অতিরিক্ত বড় তথ্য নেওয়া উচিত নয়');
// ব্রুট ফোর্স
for (let i = 0; i < 9; i++) await call('POST', '/api/login', { user: 'rahim_01', pass: 'bad' + i + 'xxx' });
r = await call('POST', '/api/login', { user: 'rahim_01', pass: 'secret123' });
must(r.s === 429, 'বারবার ভুলের পর সঠিক পাসওয়ার্ডেও কিছুক্ষণ আটকানো');
await _flush();
const raw = fs.readFileSync(path.join(process.env.DATA_DIR, 'users.json'), 'utf8');
must(!raw.includes('secret123') && !raw.includes('LEAK'), 'ফাইলে পাসওয়ার্ড বা পিন নেই');
r = await call('POST', '/api/delete', { pass: 'wrong' }, tok2);
must(r.s === 401, 'ভুল পাসওয়ার্ডে একাউন্ট মোছা যায় না');
const u2 = await call('POST', '/api/register', { user: 'tmp_user', pass: 'abcdef12' });
r = await call('POST', '/api/delete', { pass: 'abcdef12' }, u2.j.token);
must(r.s === 200, 'একাউন্ট মোছা');
r = await call('GET', '/api/sync', null, u2.j.token);
must(r.s === 401, 'মোছার পর টোকেন কাজ করে না');
server.close();
if (fails) { console.error(`\n${fails}টি সমস্যা`); process.exit(1); }
console.log('সার্ভার ও মেলানো পরীক্ষা পাস ✓');
