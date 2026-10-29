// সময়ের ব্যাংক: লেভেল পার করলে ফোন চালানোর সময় পাওয়া যায়, তারপর বিশ্রাম।
// Android এ আলাদা একটি প্লাগইন (AppLock) অন্য অ্যাপ আটকে রাখে। ব্রাউজারে শুধু এই অ্যাপের ভেতরের হিসাব চলে।
import { registerPlugin, Capacitor } from '@capacitor/core';
import { S, save } from './state.js';
import { localDate, daysAgo } from './util.js';

export const AppLock = registerPlugin('AppLock');
export const native = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

const MIN = 60000;
export const MAX_FREE_MIN = 30;
export const now = () => Date.now();
export const freeLeft = () => Math.max(0, S.time.freeUntil - now());
export const restLeft = () => Math.max(0, S.time.restUntil - now());
export const levelsToday = () => S.time.lv[localDate()] || 0;
export const capReached = () => levelsToday() >= S.parent.cap;
export const hasPin = () => !!S.parent.pinHash;

// শেখা শুরু করা যাবে কিনা
export function gate() {
  if (capReached()) return { ok: false, why: 'cap' };
  if (restLeft() > 0) return { ok: false, why: 'rest', ms: restLeft() };
  return { ok: true };
}

// নতুন লেভেল পার হলে: ফোনের সময় যোগ, বিশ্রাম শুরু
export function levelPassed() {
  const d = localDate();
  S.time.lv[d] = (S.time.lv[d] || 0) + 1;
  Object.keys(S.time.lv).forEach((k) => { if (k < daysAgo(14)) delete S.time.lv[k]; });
  const t = now();
  S.time.freeUntil = Math.min(Math.max(t, S.time.freeUntil) + S.parent.free * MIN, t + MAX_FREE_MIN * MIN);
  S.time.restUntil = t + S.parent.rest * MIN;
  save();
  syncNative();
  return S.parent.free;
}

// অভিভাবক নিজে সময় দিলে বা বিশ্রাম বাদ দিলে
export function grantFree(min) {
  const t = now();
  S.time.freeUntil = Math.min(Math.max(t, S.time.freeUntil) + min * MIN, t + MAX_FREE_MIN * MIN);
  save(); syncNative();
}
export function clearRest() { S.time.restUntil = 0; save(); }

function endOfToday() { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); }

// অন্য অ্যাপ কখন আটকাবে: দৈনিক সীমা শেষ হলে সারাদিন খোলা
export function lockUntilFree() { return capReached() ? endOfToday() : S.time.freeUntil; }
export const shouldLock = () => S.parent.lock && freeLeft() === 0 && !capReached();

export async function syncNative() {
  if (!native) return;
  try { await AppLock.setConfig({ enabled: !!S.parent.lock, freeUntil: lockUntilFree() }); } catch (e) { /* প্লাগইন না থাকলেও অ্যাপ চলবে */ }
}
export async function nativeStatus() {
  if (!native) return { supported: false };
  try { return { supported: true, ...(await AppLock.status()) }; } catch (e) { return { supported: false }; }
}

// ---------- অভিভাবকের পিন ----------
async function digest(pin) {
  const data = new TextEncoder().encode('shikhon:' + pin);
  if (globalThis.crypto && crypto.subtle) {
    const h = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let x = 5381; for (const b of data) x = ((x << 5) + x + b) >>> 0;
  return 'x' + x;
}
export async function setPin(pin) { S.parent.pinHash = await digest(pin); save(); }
export async function checkPin(pin) { return !S.parent.pinHash || (await digest(pin)) === S.parent.pinHash; }

export const fmt = (ms) => {
  const s = Math.ceil(ms / 1000), m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
