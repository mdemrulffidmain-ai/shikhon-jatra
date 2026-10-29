// AI সহায়ক (ঐচ্ছিক, অভিভাবকের অনুমতি লাগে)। ইন্টারনেট থাকলে নতুন পাঠ বানায়, আর শিশুর প্রশ্নের উত্তর দেয়।
// তৈরি পাঠ ফোনে জমা থাকে, তাই পরে ইন্টারনেট ছাড়াও চলে। ব্যর্থ হলে অ্যাপের নিজের পাঠ চলতে থাকে।
import { CapacitorHttp, Capacitor } from '@capacitor/core';
import { S, save, level } from './state.js';
import { INTERESTS, INTEREST_NAME } from '../data/index.js';
import { topInterests } from './interest.js';

export const MAX_AI_LESSONS = 30;

export const aiReady = () => !!(S.ai.on && S.ai.key && navigator.onLine !== false);

export function band(lv = level()) {
  if (lv <= 2) return 'ক্লাস ১-২ (৬-৭ বছর), খুব সহজ শব্দ';
  if (lv <= 4) return 'ক্লাস ৩-৫ (৮-১০ বছর)';
  if (lv <= 7) return 'ক্লাস ৬-৮ (১১-১৩ বছর)';
  return 'ক্লাস ৯-১০ বা তার ওপরের স্তর (১৪+ বছর), তবে স্পষ্ট ও সহজ ভাষায়';
}

async function http(url, headers, body) {
  if (Capacitor.isNativePlatform()) {
    const r = await CapacitorHttp.request({ url, method: 'POST', headers, data: body, connectTimeout: 20000, readTimeout: 60000 });
    return { status: r.status, json: typeof r.data === 'string' ? safeJson(r.data) : r.data };
  }
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => null) };
}
const safeJson = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };

export class AiError extends Error {}

function explain(status) {
  if (status === 401 || status === 403) return 'API কী ঠিক নেই বা অনুমতি নেই।';
  if (status === 429) return 'অনেক বেশি অনুরোধ হয়েছে। একটু পরে চেষ্টা করো।';
  if (status >= 500) return 'AI সেবায় সমস্যা হচ্ছে। পরে চেষ্টা করো।';
  return `AI সেবা সাড়া দেয়নি (${status})।`;
}

async function ask(system, user, maxTokens) {
  if (!S.ai.key) throw new AiError('আগে API কী দাও।');
  if (navigator.onLine === false) throw new AiError('ইন্টারনেট নেই।');
  let res;
  try {
    if (S.ai.provider === 'openai') {
      const base = (S.ai.base || 'https://api.openai.com/v1').replace(/\/+$/, '');
      res = await http(`${base}/chat/completions`, { 'content-type': 'application/json', authorization: `Bearer ${S.ai.key}` },
        { model: S.ai.model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] });
      if (res.status >= 300) throw new AiError(explain(res.status));
      return String(res.json && res.json.choices && res.json.choices[0] && res.json.choices[0].message && res.json.choices[0].message.content || '');
    }
    res = await http(`${(S.ai.base || 'https://api.anthropic.com').replace(/\/+$/, '')}/v1/messages`,
      { 'content-type': 'application/json', 'x-api-key': S.ai.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      { model: S.ai.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] });
    if (res.status >= 300) throw new AiError(explain(res.status));
    const c = res.json && res.json.content;
    return String(Array.isArray(c) ? c.filter((x) => x.type === 'text').map((x) => x.text).join('') : '');
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError('যোগাযোগ করা যায়নি। ইন্টারনেট দেখো।');
  }
}

import { clean, validateLesson, parseLesson, ICONS } from './aischema.js';
export { validateLesson, parseLesson };

const SYS_LESSON = 'তুমি বাংলাদেশের শিশুদের জন্য একজন যত্নশীল শিক্ষক। তুমি শুধু যাচাই করা, সত্য তথ্য দেবে। ভয়ের, হিংসার, প্রাপ্তবয়স্ক বা বিজ্ঞাপনের বিষয় আনবে না। ভাষা সহজ বাংলা। উত্তর শুধু JSON, আর কিছু নয়।';

export async function generateLesson(topicHint) {
  const top = topInterests(3).map((x) => x.n);
  const names = INTERESTS.map((i) => `${i.id}=${i.n}`).join(', ');
  const user = `শিশুর স্তর: ${band()}।
শিশুর আগ্রহ: ${top.length ? top.join(', ') : 'নির্দিষ্ট নয়'}।
${topicHint ? `বিষয়: ${clean(topicHint, 80)}।` : 'আগ্রহের সাথে মেলে এমন একটি দরকারি বিষয় বেছে নাও, যা জীবনে কাজে লাগবে।'}
একটি ছোট পাঠ বানাও। কার্ডগুলো একটি করে ছোট বাক্য। প্রশ্ন ৩টি, প্রতিটিতে ঠিক ৩টি বিকল্প, শুধু একটি সঠিক, বাকি দুটি স্পষ্টভাবে ভুল। why তে এক বাক্যে কারণ।
শুধু এই গড়নে JSON দাও:
{"t":"শিরোনাম","icon":"${ICONS.slice(0, 6).join('|')}...(তালিকা থেকে একটি)","tags":["আগ্রহের id"],"cards":["...","...","..."],"qs":[{"p":"প্রশ্ন","o":["ক","খ","গ"],"a":0,"why":"কারণ"}]}
icon হবে এর যেকোনো একটি: ${ICONS.join(', ')}। tags হবে এর থেকে: ${names}।`;
  const text = await ask(SYS_LESSON, user, 1400);
  const lesson = parseLesson(text);
  if (!lesson) throw new AiError('AI এর পাঠ ঠিকমতো আসেনি। আবার চেষ্টা করো।');
  S.ai.lessons.unshift(lesson);
  S.ai.lessons = S.ai.lessons.slice(0, MAX_AI_LESSONS);
  save();
  return lesson;
}

const SYS_TUTOR = 'তুমি শিশুদের একজন বন্ধুসুলভ শিক্ষক। বাংলায় ৩ থেকে ৪টি ছোট, সহজ বাক্যে উত্তর দাও। না জানলে "জানি না" বলো, অনুমান বানিয়ে বোলো না। ভয়ংকর, প্রাপ্তবয়স্ক বা বিপজ্জনক বিষয়ে উত্তর না দিয়ে বলো "এটা বাবা-মাকে জিজ্ঞেস করো"। শিশুর কাছে নাম, ঠিকানা বা ব্যক্তিগত তথ্য চেয়ো না।';

export async function askTutor(question) {
  const q = clean(question, 300);
  if (!q) throw new AiError('প্রশ্ন লেখো।');
  const text = await ask(SYS_TUTOR, `শিশুর স্তর: ${band()}।\nপ্রশ্ন: ${q}`, 500);
  return clean(text, 900) || 'জানি না। বাবা-মাকে জিজ্ঞেস করো।';
}

export async function testConnection() {
  const t = await ask('সংক্ষেপে উত্তর দাও।', 'শুধু "ঠিক আছে" লেখো।', 20);
  return !!t;
}

export function removeAiLesson(id) { S.ai.lessons = S.ai.lessons.filter((l) => l.id !== id); save(); }
export { INTEREST_NAME };
