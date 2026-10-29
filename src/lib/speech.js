// কথা শোনানো ও শোনা। ফোনে Capacitor প্লাগইন, ব্রাউজারে Web Speech।
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { S } from './state.js';
import { norm } from './util.js';

export const isNative = Capacitor.isNativePlatform();

export async function speak(text, lang) {
  if (!text || !S.sound) return;
  try {
    if (isNative) {
      await TextToSpeech.stop().catch(() => {});
      await TextToSpeech.speak({ text, lang, rate: S.rate, pitch: 1.05, volume: 1, category: 'ambient' });
      return;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = S.rate; u.pitch = 1.05;
      speechSynthesis.speak(u);
    }
  } catch (e) { /* ফোনে ওই ভাষার কণ্ঠ না থাকলেও অ্যাপ চলবে */ }
}

function matches(heard, expected) {
  const ex = expected.map(norm).filter(Boolean);
  return heard.some((h) => {
    const n = norm(h);
    return ex.some((x) => n === x || n.includes(x));
  });
}

// ফল: { ok, heard } বা { err: 'denied' | 'unsupported' | 'no-speech' | 'error' }
export async function listenFor(expected, lang) {
  try {
    if (isNative) {
      const avail = await SpeechRecognition.available();
      if (!avail.available) return { err: 'unsupported' };
      let perm = await SpeechRecognition.checkPermissions();
      if (perm.speechRecognition !== 'granted') perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== 'granted') return { err: 'denied' };
      const r = await SpeechRecognition.start({ language: lang, maxResults: 5, popup: false, partialResults: false });
      const heard = (r && r.matches) || [];
      if (!heard.length) return { err: 'no-speech' };
      return { ok: matches(heard, expected), heard: heard[0] };
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return { err: 'unsupported' };
    return await new Promise((resolve) => {
      let fin = false;
      const done = (v) => { if (!fin) { fin = true; resolve(v); } };
      const r = new SR();
      r.lang = lang; r.interimResults = false; r.maxAlternatives = 5;
      r.onresult = (e) => {
        const heard = Array.from(e.results[0]).map((a) => a.transcript);
        done({ ok: matches(heard, expected), heard: heard[0] });
      };
      r.onerror = (e) => done({ err: e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'no-speech' ? 'no-speech' : 'error' });
      r.onend = () => done({ err: 'no-speech' });
      r.start();
    });
  } catch (e) {
    return { err: 'error' };
  }
}

export async function stopListening() {
  try { if (isNative) await SpeechRecognition.stop(); } catch (e) { /* ঠিক আছে */ }
}
