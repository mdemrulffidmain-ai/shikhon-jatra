// ডেটা ও প্রশ্ন তৈরির স্বয়ংক্রিয় পরীক্ষা। চালাতে: npm test
import { SUBJECTS, CARDS, TOPICS, INTERESTS } from '../src/data/index.js';
import { GEN } from '../src/data/life.js';
import { buildQuestions, GENS } from '../src/data/topics.js';
import { validateLesson, parseLesson } from '../src/lib/aischema.js';
import { questions, practiceQuestions } from '../src/lib/quiz.js';
import { bd } from '../src/lib/util.js';
import { ALLGENS } from '../src/data/topics.js';
import { mulFactQ } from '../src/data/mathpath.js';
import { vocabById, ALLV } from '../src/data/english.js';
import { MISSIONS } from '../src/data/index.js';

let fails = 0;
const bad = (m) => { fails++; console.error('✗ ' + m); };
const must = (c, m) => { if (!c) bad(m); };

// ১. ডেটা
const ids = new Set();
let itemCount = 0;
for (const s of Object.values(SUBJECTS)) {
  s.nodes.forEach((n, i) => {
    must(n.items.length >= 4, `${s.id}.${i} ${n.t}: কমপক্ষে ৪টি জিনিস দরকার`);
    must(n.steps && n.steps[0] === 'learn' && n.steps.at(-1) === 'test', `${s.id}.${i}: ধাপের ক্রম ঠিক নেই`);
    n.items.forEach((it) => {
      itemCount++;
      must(!ids.has(it.id), `ডুপ্লিকেট id: ${it.id}`); ids.add(it.id);
      must(it.ch && it.label && it.tip, `${it.id}: ch/label/tip খালি`);
      if (it.ws) must(it.label[0].toLowerCase() === it.ch.toLowerCase(), `${it.id}: ${it.label} শব্দটি ${it.ch} দিয়ে শুরু নয়`);
      if (n.type === 'calc') {
        const r = it.op === '+' ? it.a + it.b : it.a - it.b;
        must(r === it.n && r >= 0 && r <= 10, `${it.id}: গণনা ভুল`);
      }
      if (n.type === 'money') must([1, 2, 5, 10].includes(it.n), `${it.id}: অজানা মুদ্রা`);
    });
  });
}
must(new Set(CARDS.map((c) => c.id)).size === CARDS.length, 'কার্ডের id ডুপ্লিকেট');
const totalNodes = Object.values(SUBJECTS).reduce((a, s) => a + s.nodes.length, 0);
must(CARDS.length >= totalNodes / 2, 'কার্ড সংখ্যা কম');

// ২. প্রতিটি ধাপের প্রশ্ন: ঠিক একটি সঠিক উত্তর, বিকল্প আলাদা
function checkQ(q, tag) {
  must(q.p && q.opts && q.opts.length >= 2, `${tag}: বিকল্প কম`);
  const right = q.opts.filter((o) => o.v === q.ans).length;
  must(right === 1, `${tag}: সঠিক উত্তর ${right}টি (${q.p})`);
  must(new Set(q.opts.map((o) => String(o.h))).size === q.opts.length, `${tag}: একই বিকল্প দুবার (${q.opts.map((o) => o.h).join('|')})`);
  must(!!q.why, `${tag}: why নেই`);
}
let qCount = 0;
for (const s of Object.values(SUBJECTS)) {
  s.nodes.forEach((n, i) => {
    for (let r = 0; r < 60; r++) {
      questions(s.id, i, 5).forEach((q) => { qCount++; checkQ(q, `${s.id}.${i} ${n.t}`); });
    }
  });
}

// ৩. সব পাঠ (জীবন-শিক্ষা, বিজ্ঞান, দক্ষতা)
const known = new Set(INTERESTS.map((i) => i.id));
const topicIds = new Set();
for (const [w, list] of Object.entries(TOPICS)) {
  list.forEach((l) => {
    must(!topicIds.has(l.id), `পাঠের id ডুপ্লিকেট: ${l.id}`); topicIds.add(l.id);
    must(l.w === w, `${l.id}: w ভুল`);
    must(l.cards.length >= 2 && l.qs.length >= 3, `${l.id}: কার্ড/প্রশ্ন কম`);
    must(l.tags.length > 0 && l.tags.every((g) => known.has(g)), `${l.id}: ট্যাগ ভুল`);
    must(l.req >= 1 && l.req <= 4, `${l.id}: req ভুল`);
    for (let r = 0; r < 60; r++) {
      buildQuestions(l).forEach((q) => {
        qCount++;
        must(q.o.length >= 2 && q.a >= 0 && q.a < q.o.length, `${l.id}: উত্তরের সূচি ভুল`);
        must(new Set(q.o).size === q.o.length, `${l.id}: একই বিকল্প (${q.o.join('|')})`);
        must(!!q.why && !!q.p, `${l.id}: প্রশ্ন বা why নেই`);
      });
    }
  });
}
for (const k of Object.keys(GENS)) {
  for (let r = 0; r < 300; r++) {
    const q = GENS[k]();
    must(q.o[q.a] && new Set(q.o).size === q.o.length, `GENS.${k}: ভুল বিকল্প (${q.o})`);
    must(!q.o.some((x) => /[-−]/.test(String(x).replace(/[^-−]/g, '')) && /^[-−]/.test(x)), `GENS.${k}: ঋণাত্মক সংখ্যা`);
  }
}
// প্যাটার্নের উত্তর সত্যিই ঠিক কিনা
for (let r = 0; r < 200; r++) {
  const q = GENS.pattern();
  const nums = q.p.match(/[০-৯]+/g).map((x) => +x.replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c)));
  const d = nums[1] - nums[0];
  must(nums.every((v, i) => i === 0 || v - nums[i - 1] === d), 'প্যাটার্ন ধাপ সমান নয়');
  const want = bd(nums[3] + d);
  must(q.o[q.a] === want, `প্যাটার্ন উত্তর ভুল: ${q.p} → ${q.o[q.a]} (চাই ${want})`);
}

// AI পাঠের যাচাই: ভালো গড়ন নেয়, খারাপ গড়ন ফেরায়
const goodAi = { t: 'পানির খেলা', icon: 'drop', tags: ['nature', 'zzz'], cards: ['পানি তরল।', 'পানি জমলে বরফ হয়।'], qs: [0, 1, 2].map(() => ({ p: 'পানি জমলে কী হয়?', o: ['বরফ', 'আগুন', 'ধুলো'], a: 0, why: 'জমলে বরফ।' })) };
const v = validateLesson(goodAi);
must(v && v.tags.join() === 'nature' && v.w === 'ai' && v.id.startsWith('ai:'), 'AI ভালো পাঠ নেয়নি');
must(validateLesson({ ...goodAi, qs: goodAi.qs.slice(0, 2) }) === null, 'AI: ২টি প্রশ্নের পাঠ নেওয়া উচিত নয়');
must(validateLesson({ ...goodAi, qs: [{ ...goodAi.qs[0], a: 5 }, goodAi.qs[1], goodAi.qs[2]] }) === null, 'AI: ভুল উত্তর-সূচি নেওয়া উচিত নয়');
must(validateLesson({ ...goodAi, qs: [{ ...goodAi.qs[0], o: ['ক', 'ক', 'খ'] }, goodAi.qs[1], goodAi.qs[2]] }) === null, 'AI: একই বিকল্প নেওয়া উচিত নয়');
must(parseLesson('এই নাও: ' + JSON.stringify(goodAi) + ' ধন্যবাদ') !== null, 'AI: JSON এর চারপাশের লেখা সামলায়নি');
must(parseLesson('জানি না') === null, 'AI: JSON ছাড়া লেখা নেওয়া উচিত নয়');
const evil = validateLesson({ ...goodAi, t: '<img src=x onerror=alert(1)>পাঠ' });
must(evil && !/[<>]/.test(evil.t), 'AI: ট্যাগ ছাঁটা হয়নি');

// ৪. অনুশীলন
const learned = [{ s: 'bn', i: 0 }, { s: 'mt', i: 3 }];
for (let r = 0; r < 50; r++) practiceQuestions(learned, {}, 5).forEach((q) => checkQ(q, 'practice'));

// ৫. পুনরাবৃত্তির আইডি থেকে প্রশ্ন আবার বানানো যায় কিনা
for (const [a, b] of [[7, 8], [6, 9], [2, 5]]) { const q = mulFactQ(a, b); must(q.id === `x|${a}|${b}` && q.o[q.a] === bd(a * b), `নামতার প্রশ্ন ${a}×${b}`); checkQ({ p: q.p, opts: q.o.map((h, v) => ({ v, h })), ans: q.a, why: q.why }, 'mulfact'); }
for (const [en] of ALLV) { const q = vocabById('v|' + en); must(q && q.o.length === 4 && new Set(q.o).size === 4, `শব্দের প্রশ্ন ${en}`); }
must(new Set(ALLV.map((x) => x[0])).size === ALLV.length, 'শব্দ ডুপ্লিকেট');
must(new Set(ALLV.map((x) => x[1])).size === ALLV.length, 'বাংলা অর্থ ডুপ্লিকেট (বিকল্প গুলিয়ে যাবে)');
// ৬. সব যন্ত্র নামে পাওয়া যায়
for (const l of Object.values(TOPICS).flat()) for (const q of l.qs) if (typeof q === 'string') must(!!ALLGENS[q], `${l.id}: অজানা যন্ত্র ${q}`);
// ৭. মিশন
const mids = new Set();
for (const m of MISSIONS) { must(!mids.has(m.id), 'মিশন id ডুপ্লিকেট ' + m.id); mids.add(m.id); must(m.steps.length >= 2 && m.ask && m.why && m.band >= 1 && m.band <= 4, 'মিশন অসম্পূর্ণ ' + m.id); }

console.log(`জিনিস ${bd(itemCount)}টি, ধাপ ${bd(totalNodes)}টি, পাঠ ${bd(Object.values(TOPICS).flat().length)}টি, কার্ড ${bd(CARDS.length)}টি, প্রশ্ন পরীক্ষা ${qCount}টি`);
if (fails) { console.error(`\n${fails}টি সমস্যা পাওয়া গেছে`); process.exit(1); }
console.log('সব পরীক্ষা পাস ✓');
