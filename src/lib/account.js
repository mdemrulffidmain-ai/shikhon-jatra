// একাউন্ট ও সিঙ্ক। অফলাইনে অ্যাপ আগের মতোই চলে; ইন্টারনেট এলে অগ্রগতি সার্ভারের সাথে মেলানো হয়।
// সার্ভারে যায় শুধু শেখার অগ্রগতি। পিন, ফোনের সময়, API কী কখনো যায় না (দেখো merge.js এর SYNC_KEYS)।
import { CapacitorHttp, Capacitor } from '@capacitor/core';
import { S, save, onSave } from './state.js';
import { merge, pick, applyTo } from './merge.js';
import { DEFAULT_SERVER } from '../config.js';

export const server = () => (S.account.server || DEFAULT_SERVER || '').replace(/\/+$/, '');
export const loggedIn = () => !!(S.account.token && S.account.user);
export class AccountError extends Error {}

async function call(method, path, body, token) {
  const base = server();
  if (!base) throw new AccountError('আগে সার্ভারের ঠিকানা দাও।');
  if (navigator.onLine === false) throw new AccountError('ইন্টারনেট নেই। পরে চেষ্টা করো।');
  const headers = { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) };
  let status, json;
  try {
    if (Capacitor.isNativePlatform()) {
      const r = await CapacitorHttp.request({ url: base + path, method, headers, data: body, connectTimeout: 15000, readTimeout: 30000 });
      status = r.status; json = typeof r.data === 'string' ? JSON.parse(r.data || '{}') : r.data;
    } else {
      const r = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
      status = r.status; json = await r.json().catch(() => ({}));
    }
  } catch (e) { throw new AccountError('সার্ভারে পৌঁছানো গেল না। ঠিকানা আর ইন্টারনেট দেখো।'); }
  if (status >= 300) {
    const m = { name: 'নাম ৩ থেকে ৩২ অক্ষরের হবে (ইংরেজি ছোট হাতের অক্ষর, সংখ্যা, _ . -)।', pass: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হবে।', taken: 'এই নামে একাউন্ট আছে। অন্য নাম দাও বা লগইন করো।', bad: 'নাম বা পাসওয়ার্ড ঠিক নেই।', locked: 'অনেকবার ভুল হয়েছে। ১৫ মিনিট পরে চেষ্টা করো।', auth: 'আবার লগইন করতে হবে।', busy: 'অনেক অনুরোধ। একটু পরে চেষ্টা করো।', big: 'তথ্য খুব বড়।', full: 'সার্ভার এখন নতুন একাউন্ট নিচ্ছে না।' };
    const e = new AccountError(m[json && json.err] || `সার্ভার সাড়া দিয়েছে (${status})।`);
    e.code = json && json.err; e.status = status;
    throw e;
  }
  return json;
}

function adopt(remote) {
  const m = merge(pick(S), remote || {});
  applyTo(S, m);
}

export async function register(user, pass) {
  const r = await call('POST', '/api/register', { user, pass, state: pick(S) });
  S.account.user = user.trim().toLowerCase(); S.account.token = r.token; S.account.last = Date.now();
  adopt(r.state); save(true);
}
export async function login(user, pass) {
  const r = await call('POST', '/api/login', { user, pass });
  S.account.user = user.trim().toLowerCase(); S.account.token = r.token;
  adopt(r.state); S.account.last = Date.now();
  // সার্ভারের সাথে মিলিয়ে শেষ অবস্থা ফেরত পাঠানো
  try { const s = await call('PUT', '/api/sync', { state: pick(S) }, S.account.token); adopt(s.state); } catch (e) { /* পরে সিঙ্ক হবে */ }
  save(true);
}
export function logout() { S.account.token = ''; S.account.user = ''; save(true); }

let busy = false, timer = null, lastTry = 0;
export async function syncNow() {
  if (!loggedIn() || busy) return false;
  busy = true;
  try {
    const r = await call('PUT', '/api/sync', { state: pick(S) }, S.account.token);
    adopt(r.state); S.account.last = Date.now(); save(true);
    return true;
  } catch (e) {
    if (e.code === 'auth') { S.account.token = ''; save(true); }
    throw e;
  } finally { busy = false; }
}

// প্রতিটি পরিবর্তনের কয়েক সেকেন্ড পরে নিজে নিজে সিঙ্ক (ব্যর্থ হলে চুপচাপ, পরে আবার)
export function startAutoSync() {
  onSave(() => {
    if (!loggedIn()) return;
    clearTimeout(timer);
    timer = setTimeout(() => { lastTry = Date.now(); syncNow().catch(() => {}); }, 8000);
  });
  window.addEventListener('online', () => { if (loggedIn()) syncNow().catch(() => {}); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && loggedIn()) syncNow().catch(() => {}); else if (loggedIn() && Date.now() - lastTry > 60000) { lastTry = Date.now(); syncNow().catch(() => {}); } });
}

export async function deleteAccount(pass) {
  if (!pass) throw new AccountError('পাসওয়ার্ড লেখো।');
  await call('POST', '/api/delete', { pass }, S.account.token);
  S.account.token = ''; S.account.user = ''; save(true);
}
