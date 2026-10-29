import { bnNodes } from './bn.js';
import { enNodes } from './en.js';
import { mtNodes } from './math.js';
import { LESSONS } from './life.js';
import { SCIENCE, SKILLS } from './topics.js';
import { MATH_LEVELS } from './mathpath.js';
import { HIGH_LEVELS } from './mathhigh.js';
const ALL_MATH = [...MATH_LEVELS, ...HIGH_LEVELS];
import { ENGLISH } from './english.js';
import { BNLANG } from './banglalang.js';
import { CAREER } from './career.js';
import { CODE } from './code.js';
import { SCI_LEVELS } from './science2.js';
import { bd } from '../lib/util.js';

// ধাপের ক্রম: শিখি → লিখি → খেলি → পরীক্ষা। শব্দ ও টাকার ধাপে লেখা নেই।
const STEPS = {
  letter: ['learn', 'write', 'play', 'test'],
  num: ['learn', 'write', 'play', 'test'],
  calc: ['learn', 'write', 'play', 'test'],
  word: ['learn', 'play', 'test'],
  money: ['learn', 'play', 'test']
};

function finalize(id, nodes) {
  nodes.forEach((n, ni) => {
    n.idx = ni;
    n.steps = STEPS[n.type];
    n.play = n.play || 'match';
    n.first = nodes.findIndex((x) => x.group === n.group) === ni;
    n.items.forEach((it) => {
      it.id = id + ':' + (it.expr || it.ch) + (it.money ? '৳' : '');
      it.subj = id;
    });
  });
  return nodes;
}

export const SUBJECTS = {
  bn: { id: 'bn', name: 'বাংলা', tag: 'পড়া ও লেখা', lang: 'bn-BD', nodes: finalize('bn', bnNodes) },
  en: { id: 'en', name: 'English', tag: 'Read & Write', lang: 'en-US', nodes: finalize('en', enNodes) },
  mt: { id: 'mt', name: 'গণিত', tag: 'গুনি, যোগ, টাকা', lang: 'bn-BD', nodes: finalize('mt', mtNodes) }
};

// জীবন-শিক্ষার পাঠে id, আগ্রহের ট্যাগ আর দরকারি লেভেল যোগ
const LIFE_TAGS = [['money'], ['money'], ['money', 'puzzle'], ['money', 'puzzle'], ['money'], ['health', 'language'], ['health', 'food'], ['health'], ['puzzle'], ['language']];
export const LIFE = LESSONS.map((l, i) => ({ ...l, id: 'life:' + i, tags: LIFE_TAGS[i] || [], req: 1, linear: true }));

// গণিত যাত্রা: প্রতিটি স্তরে ৮টি প্রশ্ন, পাস ৮০%, পর পর ক্রমে খোলে
export const MATH_PATH = ALL_MATH.map((l, i) => ({
  id: 'mh:' + i, t: `${bd(i + 1)}. ${l.t}`, icon: l.icon, tags: ['puzzle'], req: 1, linear: true,
  cards: l.cards, qs: [...l.gens, ...l.gens], mastery: true, band: l.band, idx: i
}));
const lin = (arr, pre) => arr.map((t, i) => ({ ...t, id: t.id || pre + i, linear: false, ordered: true, mastery: true }));

export const TOPICS = Object.fromEntries(Object.entries({
  life: LIFE, sc: SCIENCE, sk: SKILLS, mh: MATH_PATH, ee: lin(ENGLISH, 'ee:'), bl: lin(BNLANG, 'bl:'), cr: lin(CAREER, 'cr:'), cd: lin(CODE, 'cd:'), sp: lin(SCI_LEVELS.map((l, i) => ({ ...l, req: 1, t: `${bd(i + 1)}. ${l.t}`, tags: l.tags })), 'sp:')
}).map(([w, l]) => [w, l.map((t) => Object.assign(t, { w }))]));

// বই বা জগতের তালিকা। core = ধাপে ধাপে পথ, topic = পাঠের তালিকা
export const WORLDS = [
  { id: 'bn', name: 'বাংলা', tag: 'পড়া ও লেখা', kind: 'core' },
  { id: 'en', name: 'English', tag: 'Read & Write', kind: 'core' },
  { id: 'mt', name: 'গণিত', tag: 'গুনি, যোগ, টাকা', kind: 'core' },
  { id: 'mh', name: 'গণিত যাত্রা', tag: '৩৭ স্তর', kind: 'topic' },
  { id: 'ee', name: 'English দক্ষতা', tag: 'শব্দ, ব্যাকরণ, কাজ', kind: 'topic' },
  { id: 'bl', name: 'বাংলা ভাষা', tag: 'বানান, লেখা', kind: 'topic' },
  { id: 'cr', name: 'ক্যারিয়ার', tag: 'টাকা, কাজ, ব্যবসা', kind: 'topic' },
  { id: 'cd', name: 'কোডিং', tag: 'কম্পিউটারের ভাষা', kind: 'topic' },
  { id: 'life', name: 'জীবন-শিক্ষা', tag: 'টাকা, অভ্যাস', kind: 'topic' },
  { id: 'sp', name: 'বিজ্ঞান যাত্রা', tag: 'পদার্থ, রসায়ন, জীব', kind: 'topic' },
  { id: 'sc', name: 'বিজ্ঞান', tag: 'প্রকৃতি ও যন্ত্র', kind: 'topic' },
  { id: 'sk', name: 'দক্ষতা', tag: 'ব্যবসা ও দল', kind: 'topic' },
  { id: 'ai', name: 'আমার জন্য', tag: 'AI পাঠ', kind: 'topic' }
];
export const WORLD = Object.fromEntries(WORLDS.map((w) => [w.id, w]));
export const WORLD_ORDER = WORLDS.map((w) => w.id);
export const WORLD_NAMES = Object.fromEntries(WORLDS.map((w) => [w.id, w.name]));
export const WORLD_TAGS = Object.fromEntries(WORLDS.map((w) => [w.id, w.tag]));
export { LESSONS };
export { CARDS } from './cards.js';
export { INTERESTS, INTEREST_NAME } from './interests.js';

export { MISSIONS } from './missions.js';
