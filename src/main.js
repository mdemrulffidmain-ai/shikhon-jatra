import '@fontsource/baloo-da-2/500.css';
import '@fontsource/baloo-da-2/700.css';
import '@fontsource/baloo-da-2/800.css';
import '@fontsource/hind-siliguri/400.css';
import '@fontsource/hind-siliguri/600.css';
import './style.css';
import { App as CapApp } from '@capacitor/app';
import { SUBJECTS, TOPICS, WORLDS, WORLD, CARDS, INTERESTS, INTEREST_NAME, MISSIONS } from './data/index.js';
import { buildQuestions, passMark } from './data/topics.js';
import { S, loadState, save, resetAll, ageBand, worldWhy, dueCount, nk, isDone, nodeDone, nodeUnlocked, stepUnlocked, worldUnlocked, topicDone, topicUnlocked,
  markStep, addXP, level, levelPct, streak, todayCount, DAILY_GOAL, totalStars, record, learnedNodes, weakItems, awardCard, passedCount } from './lib/state.js';
import { esc, bd, NUMW, shuffle } from './lib/util.js';
import { questions, practiceQuestions } from './lib/quiz.js';
import { answered, settle, topicOfQuestion, dailyPlan, report, weekly, skillAnswered, skillQuestions, weakSkills, topicById, retention } from './lib/adapt.js';
import { addMistake, mistakeQuestions, mistakeResult, reviewQuestions, mixedQuestions, mixedPool, bump, todayQuests, questBonus, rank, BADGES, earned, newBadges, GRID_KINDS, makeGrid, gridDone, missionsFor, finishMission, startProbe, probeQuestions, probeStep, applyPlacement } from './lib/engine.js';
import { loggedIn, server, register, login, logout, syncNow, startAutoSync, deleteAccount, AccountError } from './lib/account.js';
import { speak, listenFor, stopListening } from './lib/speech.js';
import { sfx, confetti } from './lib/sfx.js';
import { createTrace, STAGE_NAME } from './lib/trace.js';
import { gate, levelPassed, freeLeft, restLeft, capReached, fmt, hasPin, setPin, checkPin, syncNative, nativeStatus, grantFree, clearRest, native, AppLock } from './lib/guard.js';
import { recommend, topicScore, topInterests, learnedFrom, MAX_PICK } from './lib/interest.js';
import { generateLesson, askTutor, testConnection, removeAiLesson, AiError } from './lib/ai.js';
import { mascot, scenery, icon, ui, starIcon, dotsHtml, coinHtml, swatch } from './ui/art.js';

const app = document.getElementById('app');
let V = { view: 'home' };
let stack = [];
let T = null;
const TABS = ['home', 'practice', 'cards', 'me'];

// ---------- সাধারণ ----------
const node = (s, i) => SUBJECTS[s].nodes[i];
const mode = () => S.mode || 'boy';
let toastTimer;
function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}
function setTheme() {
  const m = V.view === 'welcome' ? (V.pick || S.mode || 'boy') : mode();
  document.documentElement.setAttribute('data-mode', m);
  const bg = document.getElementById('scene');
  if (bg && bg.dataset.m !== m) { bg.innerHTML = scenery(m); bg.dataset.m = m; }
}
function go(view, extra = {}) {
  if (V.view && V.view !== 'welcome' && !TABS.includes(view)) stack.push(V);
  if (stack.length > 12) stack.shift();
  V = Object.assign({ view }, extra);
  render();
}
function setTab(view) { stack = []; V = { view }; render(); }
function back() {
  stopListening();
  const p = stack.pop();
  if (p) { V = p; render(); } else if (V.view !== 'home') setTab('home');
  else try { CapApp.exitApp(); } catch (e) { /* ব্রাউজারে বন্ধ হয় না */ }
}

// ---------- মাথার অংশ ----------
function head() {
  const goal = Math.min(todayCount(), DAILY_GOAL);
  return `<header class="top">
    <div class="who">${mascot(mode(), 'happy', 'm-sm')}<div><div class="hi">${esc(S.name || 'বন্ধু')}</div><div class="lv">লেভেল ${bd(level())} · ${rank().n}</div></div></div>
    <div class="pills">${freePill()}
      <span class="pill fire" aria-label="ধারাবাহিক দিন">${ui('flame')}${bd(streak())}</span>
      <span class="pill" aria-label="তারা">${starIcon(true, 'st')}${bd(totalStars())}</span>
    </div>
  </header>
  <div class="xpbar" aria-label="অভিজ্ঞতা"><i style="width:${Math.round(levelPct() * 100)}%"></i></div>`;
}
function tabbar() {
  const t = (v, l, ic) => `<button data-act="tab" data-v="${v}" ${V.view === v ? 'aria-current="page"' : ''}>${ui(ic)}<span>${l}</span></button>`;
  return `<nav class="tabbar" aria-label="মূল মেনু"><div>${t('home', 'যাত্রা', 'map')}${t('practice', 'অনুশীলন', 'target')}${t('cards', 'কার্ড', 'cards')}${t('me', 'আমি', 'user')}</div></nav>`;
}
const backBtn = (act = 'back', label = 'ফিরি') => `<button class="back" data-act="${act}">${ui('left')}${label}</button>`;

// ---------- শুরুর পর্দা ----------
const AGES = [[1, '৫-৭'], [2, '৮-১১'], [3, '১২-১৫'], [4, '১৬+']];
function vWelcome() {
  const m = V.pick || S.mode || 'boy';
  document.documentElement.setAttribute('data-mode', m);
  return `<div class="screen welcome">
    <div class="hero bounce">${mascot(m, 'cheer', 'm-xl')}</div>
    <h1>আমার শিখন যাত্রা</h1>
    <p class="lead">পড়া, লেখা, গণিত আর জীবনের দরকারি কথা। একটু একটু করে, খেলতে খেলতে।</p>
    <div class="field"><label for="nm">তোমার নাম কী?</label><input id="nm" type="text" maxlength="24" autocomplete="off" value="${esc(V.nm || '')}" placeholder="এখানে নাম লেখো"></div>
    <div class="label">তোমার বয়স কত?</div>
    <div class="seg ages">${AGES.map(([v, l]) => `<button data-act="pickage" data-v="${v}" aria-pressed="${V.age === v}">${l}</button>`).join('')}</div>
    <div class="label">কেমন বন্ধু চাও?</div>
    <div class="modes three">
      <button class="mode" data-act="pickmode" data-m="boy" aria-pressed="${m === 'boy'}">${mascot('boy', 'happy', 'm-md')}<b>রোবট বন্ধু</b><small>মহাকাশের জগৎ</small></button>
      <button class="mode" data-act="pickmode" data-m="girl" aria-pressed="${m === 'girl'}">${mascot('girl', 'happy', 'm-md')}<b>প্রজাপতি বন্ধু</b><small>ফুলের বাগান</small></button>
      <button class="mode" data-act="pickmode" data-m="teen" aria-pressed="${m === 'teen'}">${mascot('teen', 'happy', 'm-md')}<b>সহজ ও আধুনিক</b><small>বড়দের জন্য</small></button>
    </div>
    <div class="label">কী ভালো লাগে? (সর্বোচ্চ ${bd(MAX_PICK)}টি, না বাছলেও চলবে)</div>
    ${interestChips(V.ints || [])}
    <button class="btn big" data-act="start">শুরু করি</button>
  </div>`;
}

// ---------- যাত্রার মানচিত্র ----------
function discHtml(state, n) {
  return `<span class="disc">${state === 'lock' ? ui('lock') : state === 'done' ? ui('check') : n}</span>`;
}
// ---------- ধাপের পর্দা ----------
const STEP_INFO = {
  learn: ['শিখি ও বলি', 'দেখো, শোনো, তারপর নিজে বলো', 'mic'],
  write: ['লিখি', 'হাত দিয়ে অক্ষরের ওপর লেখো', 'pen'],
  play: ['খেলি', 'মেলাও আর শেখা পাকা করো', 'play'],
  test: ['পরীক্ষা', '৫টির মধ্যে ৪টি ঠিক হলে পাস', 'target']
};
function vNode() {
  const { s, i } = V, n = node(s, i);
  const rows = n.steps.map((name, k) => {
    const un = stepUnlocked(s, i, name), dn = isDone(s, i, name);
    const info = STEP_INFO[name];
    const sub = !un ? 'আগের ধাপ শেষ করলে খুলবে' : name === 'play' && n.play === 'coins' ? 'কয়েন গুনে টাকা বানাও' : info[1];
    return `<button class="step ${un ? '' : 'lock'} ${dn ? 'done' : ''}" data-act="step" data-st="${name}"><span class="no">${!un ? ui('lock') : dn ? ui('check') : ui(info[2])}</span><span class="tx"><b>${info[0]}</b><small>${sub}</small></span></button>`;
  }).join('');
  const chips = n.items.map((x) => `<span>${x.expr ? esc(x.expr) : esc(x.ch)}</span>`).join('');
  return `<div class="screen">${backBtn('home', 'যাত্রা')}<h1 class="ttl">${esc(n.t)}</h1><div class="chips">${chips}</div><div class="steps">${rows}</div></div>`;
}

// ---------- শিখি ও বলি ----------
function show(it, n) {
  const sw = it.swatch ? swatch(it.swatch) : '';
  switch (n.type) {
    case 'letter': return `<div class="big-ch">${esc(it.ch)}</div><div class="big-w">${esc(it.label)}</div>`;
    case 'word': return `${sw}<div class="big-w xl">${esc(it.label)}</div>`;
    case 'num': return `<div class="big-ch">${esc(it.ch)}</div>${it.big ? '' : dotsHtml(it.n)}<div class="big-w">${esc(it.label)}</div>`;
    case 'calc': return `<div class="big-ex">${esc(it.expr)} = ${esc(it.ch)}</div><div class="q-dots">${dotsHtml(it.a)}<span class="q-op">${it.op === '+' ? '+' : '−'}</span>${dotsHtml(it.b)}</div><div class="big-w">${esc(it.label)}</div>`;
    case 'money': return `<div class="q-coin">${coinHtml(it.n, 'coin xl')}</div><div class="big-w">${esc(it.label)}</div>`;
    default: return '';
  }
}
function sayText(it, n) {
  if (n.type === 'calc') return `${NUMW[it.a]} ${it.op === '+' ? 'যোগ' : 'বিয়োগ'} ${NUMW[it.b]} সমান ${it.label}`;
  return it.label;
}
function expected(it) {
  const e = [it.label, it.ch];
  if (it.en) e.push(it.en);
  e.push(it.label.split(' ')[0]);
  return e;
}
function vLearn() {
  const { s, i, k } = V, n = node(s, i), it = n.items[k];
  const prog = n.items.map((x, j) => `<i class="${j < k ? 'on' : j === k ? 'now' : ''}"></i>`).join('');
  const can = V.got || V.tries >= 3;
  const ask = n.type === 'calc' ? 'উত্তরটি জোরে বলো।' : n.type === 'letter' ? 'শব্দটি জোরে বলো।' : 'জোরে বলো।';
  return `<div class="screen">${backBtn('node-back', 'ধাপ')}<div class="progress">${prog}</div>
    <div class="plate">${show(it, n)}<p class="tip">${esc(it.tip)}</p></div>
    <div class="say ${V.cls || ''}" aria-live="polite">${V.msg || ask}</div>
    <div class="row"><button class="btn alt" data-act="hear">${ui('speaker')}শুনি</button><button class="btn" data-act="mic" ${V.listening ? 'disabled' : ''}>${ui('mic')}${V.listening ? 'শুনছি…' : 'বলি'}</button></div>
    ${V.micFail && !V.got ? `<div class="row"><button class="btn alt" data-act="manual">আমি বলেছি</button></div><p class="note">${V.micFail === 'denied' ? 'মাইকের অনুমতি দেওয়া নেই। সেটিংসে গিয়ে অনুমতি দিতে পারো।' : 'এই ফোনে বলা যাচাই হচ্ছে না। জোরে বলে এই বোতাম চাপো।'}</p>` : ''}
    <div class="row"><button class="btn go" data-act="learn-next" ${can ? '' : 'disabled'}>${k === n.items.length - 1 ? 'শেষ করি' : 'পরেরটা'}</button></div></div>`;
}
function startLearn() {
  go('learn', { s: V.s, i: V.i, k: 0, tries: 0, got: false, msg: '', cls: '' });
  autoSpeak();
}
function autoSpeak() {
  const n = node(V.s, V.i), it = n.items[V.k];
  setTimeout(() => { if (V.view === 'learn') speak(sayText(it, n), SUBJECTS[V.s].lang); }, 350);
}
async function doMic() {
  const n = node(V.s, V.i), it = n.items[V.k];
  V.listening = true; V.msg = 'শুনছি… বলো'; V.cls = ''; render();
  const r = await listenFor(expected(it), SUBJECTS[V.s].lang);
  if (V.view !== 'learn') return;
  V.listening = false;
  if (r.err) {
    if (r.err === 'no-speech') { V.tries++; V.msg = 'কিছু শুনতে পাইনি। আবার বলো।' + (V.tries >= 3 ? ' চাইলে পরেরটায় যেতে পারো।' : ''); V.cls = 'bad'; } else { V.micFail = r.err; V.msg = 'মাইক পাওয়া যাচ্ছে না।'; V.cls = ''; }
  } else if (r.ok) {
    V.got = true; V.msg = 'ঠিক হয়েছে! সুন্দর বলেছ।'; V.cls = 'ok'; sfx.ok(); record(it.id, true);
    setTimeout(() => speak(it.tip, 'bn-BD'), 500);
  } else {
    V.tries++; record(it.id, false);
    V.msg = 'ভুল হয়েছে। আবার শুনে বলো।' + (V.tries >= 3 ? ' চাইলে পরেরটায় যেতে পারো।' : ''); V.cls = 'bad'; sfx.bad();
  }
  render();
}
function learnNext() {
  const n = node(V.s, V.i);
  if (V.k < n.items.length - 1) { V.k++; V.tries = 0; V.got = false; V.msg = ''; V.cls = ''; V.micFail = null; render(); autoSpeak(); return; }
  if (markStep(V.s, V.i, 'learn')) addXP(10); else addXP(2);
  sfx.win(); toast('শেখা শেষ!');
  nodeScreen(V.s, V.i);
}
function nodeScreen(s, i) { stack = stack.filter((x) => x.view === 'home'); V = { view: 'node', s, i }; render(); }

// ---------- লিখি ----------
function startWrite() {
  const n = node(V.s, V.i);
  go('write', { s: V.s, i: V.i, k: 0, a: 0, tries: 0, passed: false, msg: '', cls: '', stages: n.first ? [1, 2] : [2, 3] });
}
function vWrite() {
  const { s, i, k, a, stages } = V, n = node(s, i), it = n.items[k];
  const total = n.items.length * stages.length, idx = k * stages.length + a;
  const prog = Array.from({ length: total }, (_, j) => `<i class="${j < idx ? 'on' : j === idx ? 'now' : ''}"></i>`).join('');
  const hint = n.type === 'calc' ? `<div class="hint">${esc(it.expr)} = ?</div>` : `<div class="hint">${esc(it.label)}</div>`;
  return `<div class="screen">${backBtn('node-back', 'ধাপ')}<div class="progress">${prog}</div>
    <div class="center"><span class="badge">${STAGE_NAME[stages[a]]}</span>${hint}</div>
    <div class="trace" id="trace"></div>
    <div class="say ${V.cls || ''}" aria-live="polite">${V.msg || 'আঙুল দিয়ে অক্ষরের ওপর দিয়ে আঁকো।'}</div>
    <div class="row"><button class="btn alt" data-act="wclear">${ui('eraser')}মুছি</button>${stages[a] === 3 ? `<button class="btn alt" data-act="wpeek">${ui('eye')}দেখি</button>` : ''}<button class="btn" data-act="wcheck">${ui('check')}ঠিক আছে?</button></div>
    <div class="row"><button class="btn go" data-act="wnext" ${V.passed || V.tries >= 3 ? '' : 'disabled'}>পরেরটা</button></div></div>`;
}
async function initWrite() {
  const { s, i, k, a, stages } = V, it = node(s, i).items[k];
  const host = document.getElementById('trace');
  const tok = V;
  T = await createTrace(host, it.ch, stages[a]);
  if (!T || tok !== V) return;
  if (stages[a] === 3) {
    setSay('ভালো করে দেখে নাও…', '');
    setTimeout(() => { if (tok === V) { T.guide(false); setSay('এবার মনে করে লেখো।', ''); } }, 2200);
  }
}
function setSay(m, c) { V.msg = m; V.cls = c || ''; const e = document.querySelector('.say'); if (e) { e.textContent = m; e.className = 'say ' + (c || ''); } }
function enableNext() { const b = document.querySelector('[data-act="wnext"]'); if (b) b.disabled = false; }
function wcheck() {
  if (!T) return;
  const r = T.check(), it = node(V.s, V.i).items[V.k];
  if (r.ok) { V.passed = true; setSay(r.m, 'ok'); sfx.ok(); enableNext(); record(it.id, true); } else {
    V.tries++; sfx.bad(); setSay(r.m + (V.tries >= 3 ? ' চাইলে পরেরটায় যেতে পারো।' : ''), 'bad');
    if (V.tries >= 3) enableNext();
  }
}
function wnext() {
  const n = node(V.s, V.i);
  V.a++;
  if (V.a >= V.stages.length) { V.a = 0; V.k++; }
  if (V.k >= n.items.length) {
    if (markStep(V.s, V.i, 'write')) addXP(15); else addXP(3);
    sfx.win(); toast('লেখা শেষ!'); nodeScreen(V.s, V.i); return;
  }
  V.tries = 0; V.passed = false; V.msg = ''; V.cls = ''; render();
}

// ---------- খেলি ----------
function pairParts(it, n) {
  switch (n.type) {
    case 'letter': return { l: `<span class="pl">${esc(it.ch)}</span>`, r: `<span class="pr">${esc(it.label)}</span>`, say: it.label };
    case 'word': return { l: `<span class="pl">${ui('speaker', 'ui lg')}</span>`, r: `<span class="pr">${it.swatch ? swatch(it.swatch) : ''}${esc(it.label)}</span>`, say: it.label };
    case 'num': return { l: `<span class="pl">${esc(it.ch)}</span>`, r: it.big ? `<span class="pr">${esc(it.label)}</span>` : dotsHtml(it.n, 'dots pair'), say: it.label };
    case 'calc': return { l: `<span class="pl sm">${esc(it.expr)}</span>`, r: `<span class="pr">${esc(it.ch)}</span>`, say: null };
    default: return { l: '', r: '', say: null };
  }
}
function startPlay() {
  const n = node(V.s, V.i);
  if (n.play === 'coins') {
    const targets = shuffle([3, 4, 6, 7, 8, 9, 11, 12, 13, 15]).slice(0, 4);
    go('coins', { s: V.s, i: V.i, targets, r: 0, sum: 0, tray: [], msg: '', cls: '' });
    return;
  }
  const items = shuffle(n.items).slice(0, 4);
  go('play', {
    s: V.s, i: V.i, pairs: items.map((it) => Object.assign({ id: it.id }, pairParts(it, n))),
    lorder: shuffle(items.map((_, j) => j)), rorder: shuffle(items.map((_, j) => j)), sel: null, done: [], bad: null, miss: 0, msg: '', cls: ''
  });
}
function vPlay() {
  const L = V.lorder.map((j) => {
    const p = V.pairs[j], dn = V.done.includes(j);
    return `<button class="tile ${dn ? 'ok' : ''} ${V.sel === j ? 'sel' : ''} ${V.bad === 'l' + j ? 'wrong' : ''}" data-act="pl" data-j="${j}" ${dn ? 'disabled' : ''}>${p.l}</button>`;
  }).join('');
  const R = V.rorder.map((j) => {
    const p = V.pairs[j], dn = V.done.includes(j);
    return `<button class="tile ${dn ? 'ok' : ''} ${V.bad === 'r' + j ? 'wrong' : ''}" data-act="pr" data-j="${j}" ${dn ? 'disabled' : ''}>${p.r}</button>`;
  }).join('');
  const fin = V.done.length === V.pairs.length;
  return `<div class="screen">${backBtn('node-back', 'ধাপ')}<h2 class="ttl2">জোড়া মেলাও</h2><p class="lead sm">বাঁ দিক থেকে একটি বাছো, তারপর ডান দিকে তার জোড়া বাছো।</p>
    <div class="pairs"><div class="col">${L}</div><div class="col">${R}</div></div>
    <div class="say ${V.cls || ''}" aria-live="polite">${V.msg || ''}</div>
    ${fin ? `<div class="row"><button class="btn go" data-act="play-done">শেষ করি</button></div>` : ''}</div>`;
}
function playTap(side, j) {
  if (side === 'l') {
    V.sel = j; V.bad = null; sfx.tap();
    const p = V.pairs[j]; if (p.say) speak(p.say, SUBJECTS[V.s].lang);
    render(); return;
  }
  if (V.sel === null) { V.msg = 'আগে বাঁ দিক থেকে একটি বাছো।'; V.cls = ''; render(); return; }
  if (V.sel === j) {
    V.done.push(j); V.sel = null; V.bad = null; V.msg = 'ঠিক হয়েছে!'; V.cls = 'ok'; sfx.ok(); record(V.pairs[j].id, true);
  } else {
    V.miss++; V.bad = 'r' + j; V.msg = 'মেলেনি। আবার চেষ্টা করো।'; V.cls = 'bad'; sfx.bad(); record(V.pairs[V.sel].id, false);
  }
  render();
}
function playDone() {
  if (markStep(V.s, V.i, 'play')) addXP(15); else addXP(3);
  sfx.win(); confetti(); toast('খেলা শেষ! এবার পরীক্ষা'); nodeScreen(V.s, V.i);
}

// কয়েন গুনে টাকা বানানো
function vCoins() {
  const target = V.targets[V.r];
  const tray = V.tray.map((c) => `<span class="tray-c">${coinHtml(c, 'coin md')}</span>`).join('');
  return `<div class="screen">${backBtn('node-back', 'ধাপ')}<h2 class="ttl2">টাকা বানাও (${bd(V.r + 1)}/${bd(V.targets.length)})</h2>
    <div class="plate"><div class="q-p">${bd(target)} টাকা বানাও</div><div class="sumline">এখন আছে: <b>${bd(V.sum)} টাকা</b></div><div class="tray">${tray || '<span class="note">নিচ থেকে কয়েন বাছো</span>'}</div></div>
    <div class="coins">${[1, 2, 5, 10].map((c) => `<button class="coinbtn" data-act="coin" data-c="${c}" aria-label="${bd(c)} টাকা">${coinHtml(c, 'coin lg')}</button>`).join('')}</div>
    <div class="say ${V.cls || ''}" aria-live="polite">${V.msg || ''}</div>
    <div class="row"><button class="btn alt" data-act="coin-reset">${ui('redo')}আবার</button></div></div>`;
}
function coinTap(c) {
  const target = V.targets[V.r];
  V.tray.push(c); V.sum += c; sfx.tap();
  if (V.sum === target) {
    V.msg = 'ঠিক হয়েছে!'; V.cls = 'ok'; sfx.ok(); render();
    setTimeout(() => {
      if (V.view !== 'coins') return;
      V.r++;
      if (V.r >= V.targets.length) { playDone(); return; }
      V.sum = 0; V.tray = []; V.msg = ''; V.cls = ''; render();
    }, 900);
    return;
  }
  if (V.sum > target) { V.msg = 'বেশি হয়ে গেছে। আবার চেষ্টা করো।'; V.cls = 'bad'; sfx.bad(); V.sum = 0; V.tray = []; }
  else { V.msg = ''; V.cls = ''; }
  render();
}

// ---------- কুইজ (পরীক্ষা, অনুশীলন, জীবন-শিক্ষা) ----------
function startQuiz(kind, qs, meta) {
  go('quiz', { kind, qs, meta, q: 0, score: 0, pick: undefined, msg: '', cls: '' });
  const q = V.qs[0]; if (q.say) setTimeout(() => speak(q.say, q.lang), 300);
}
function vQuiz() {
  const q = V.qs[V.q];
  const prog = V.qs.map((x, j) => `<i class="${j < V.q ? 'on' : j === V.q ? 'now' : ''}"></i>`).join('');
  const long = q.opts.some((o) => String(o.h).length > 7);
  const picked = V.pick !== undefined;
  const opts = q.opts.map((o, j) => {
    let c = '';
    if (picked) c = j === V.pick ? (o.v === q.ans ? 'right' : 'wrong') : o.v === q.ans ? 'right' : '';
    return `<button class="opt ${long ? 'long' : ''} ${c}" data-act="opt" data-j="${j}" ${picked ? 'disabled' : ''}>${esc(o.h)}</button>`;
  }).join('');
  const last = V.q === V.qs.length - 1;
  return `<div class="screen">${backBtn('quit', 'বের হই')}<div class="progress">${prog}</div>
    <div class="plate">${q.show || ''}<p class="q-p">${esc(q.p)}</p>${q.say ? `<button class="mini" data-act="qhear">${ui('speaker')}শুনি</button>` : ''}</div>
    <div class="opts ${long ? 'one' : ''}">${opts}</div>
    <div class="say ${V.cls || ''}" aria-live="polite">${V.msg || ''}</div>
    <div class="row"><button class="btn go" data-act="qnext" ${picked ? '' : 'disabled'}>${last ? 'ফলাফল দেখি' : 'পরের প্রশ্ন'}</button></div></div>`;
}
function pickOpt(j) {
  const q = V.qs[V.q];
  if (V.pick !== undefined) return;
  V.pick = j;
  const ok = q.opts[j].v === q.ans;
  record(q.id, ok);
  if (q.sk) skillAnswered(q.sk, ok);
  { const tid = topicOfQuestion(q.id, V.meta); if (tid) { answered(tid, ok); const y = (V.tally || (V.tally = {}))[tid] || (V.tally[tid] = { c: 0, n: 0 }); y.n++; if (ok) y.c++; } }
  if (V.kind === 'mistake') { mistakeResult(q.mk, ok); if (ok) bump('mistake'); } else if (!ok) addMistake(q);
  if (ok) { V.score++; V.msg = 'ঠিক হয়েছে!'; V.cls = 'ok'; sfx.ok(); } else { V.msg = 'ভুল হয়েছে। ' + (q.why || ''); V.cls = 'bad'; sfx.bad(); }
  render();
}
function qNext() {
  if (V.q < V.qs.length - 1) {
    V.q++; V.pick = undefined; V.msg = ''; V.cls = ''; render();
    const q = V.qs[V.q]; if (q.say) setTimeout(() => speak(q.say, q.lang), 250);
    return;
  }
  finishQuiz();
}
function finishQuiz() {
  const { kind, meta, score, qs } = V, n = qs.length;
  if (V.tally) settle(V.tally);
  let res;
  if (kind === 'node') {
    const pass = score >= 4, stars = score >= 5 ? 3 : score >= 4 ? 2 : score >= 3 ? 1 : 0;
    res = { pass, score, n, stars, xp: 0, card: null, again: 'retest', meta };
    if (pass) {
      const first = markStep(meta.s, meta.i, 'test');
      const k = nk(meta.s, meta.i);
      S.stars[k] = Math.max(S.stars[k] || 0, stars);
      res.xp = first ? 25 + stars * 10 : 5;
      if (first) { res.card = awardCard(); res.free = levelPassed(); }
      addXP(res.xp);
    } else addXP(2);
  } else if (kind === 'topic') {
    const need = passMark(meta.t, n), pass = score >= need, stars = score === n ? 3 : pass ? 2 : 0;
    res = { pass, score, n, need, stars, xp: 0, card: null, again: 'retopic', meta };
    if (pass) {
      const first = !topicDone(meta.id);
      S.topics[meta.id] = true;
      S.stars['t.' + meta.id] = Math.max(S.stars['t.' + meta.id] || 0, stars);
      res.xp = first ? (meta.t.mastery ? 40 : 30) : 5;
      if (first) { res.card = awardCard(); res.free = levelPassed(); learnedFrom(meta.tags, stars); }
      bump('pass');
      addXP(res.xp);
    } else addXP(2);
  } else if (kind === 'probe') {
    const st = meta.st, step = probeStep(st, score);
    if (!step.end) { stack = []; V = { view: 'home' }; toast(score >= 2 ? 'ভালো! আরেকটু কঠিন প্রশ্ন' : 'একটু সহজ প্রশ্ন দেখি'); runProbe(st); return; }
    applyPlacement(step.level);
    const lines = step.level < 0 ? ['গণিত যাত্রা একদম শুরু থেকে শুরু করাই ভালো।'] : [`তোমার স্তর ${bd(step.level + 1)} পর্যন্ত পাওয়া গেল।`, `স্তর ${bd(Math.min(37, step.level + 2))} পর্যন্ত খুলে দিলাম। প্রতিটি স্তরের পরীক্ষা পাস করলেই তা গোনা হবে।`];
    res = { pass: true, score: 0, n: 0, stars: 0, xp: 0, lines, card: null, again: 'tab', meta: { kind: 'practice' }, title: 'তোমার স্তর পাওয়া গেছে' };
  } else if (kind === 'review' || kind === 'mistake') {
    res = { pass: true, score, n, stars: score >= n ? 3 : score >= n - 1 ? 2 : 1, xp: score * 3 + 2, card: null, again: 'practice', meta: { kind: 'practice' } };
    addXP(res.xp); bump('review');
  } else {
    res = { pass: true, score, n, stars: score >= n ? 3 : score >= n - 1 ? 2 : 1, xp: score * 4 + 2, card: null, again: 'practice', meta: { kind: 'practice' } };
    addXP(res.xp); bump('review');
  }
  if (res.pass) { res.bonus = questBonus(); res.badges = newBadges(); }
  if (res.pass) { sfx.win(); confetti(); } else sfx.bad();
  save();
  stack = [];
  V = { view: 'result', res };
  render();
}
function vResult() {
  const r = V.res;
  const title = r.title || (r.meta && r.meta.kind === 'practice' ? 'ভালো করেছ!' : r.pass ? 'দারুণ! পাস করেছ' : 'আরেকবার চেষ্টা করি');
  const need = r.need || (r.n === 5 ? 4 : r.n - 1);
  const sub = r.lines ? r.lines.map(esc).join('<br>') : r.pass ? `${bd(r.score)}টি ঠিক, ${bd(r.n - r.score)}টি ভুল` : `${bd(r.score)}টি ঠিক। পাস করতে আরও ${bd(Math.max(1, need - r.score))}টি ঠিক লাগবে (${bd(need)}/${bd(r.n)})।`;
  return `<div class="screen result"><div class="hero bounce">${mascot(mode(), r.pass ? 'cheer' : 'sad', 'm-xl')}</div>
    <h1>${title}</h1><p class="lead">${sub}</p>
    <div class="bigstars">${[0, 1, 2].map((j) => starIcon(j < r.stars, 'st' + (j < r.stars ? ' pop' : '')).replace('<svg', `<svg style="animation-delay:${j * 0.18}s"`)).join('')}</div>
    ${r.xp ? `<div class="pill gold">+${bd(r.xp)} অভিজ্ঞতা</div>` : ''}${r.bonus ? `<div class="pill gold">আজকের তিন কাজ শেষ! +${bd(r.bonus)}</div>` : ''}${(r.badges || []).map((b) => `<div class="pill gold">${starIcon(true, 'st')} নতুন ব্যাজ: ${esc(b.t)}</div>`).join('')}
    ${r.free ? `<div class="pill gold">${ui('phone')} ফোনের সময় +${bd(r.free)} মিনিট</div><p class="note">এরপর ${bd(S.parent.rest)} মিনিট বিশ্রাম। পরের লেভেল তখন থেকে।</p>` : ''}
    ${r.card ? `<div class="newcard"><small>নতুন জ্ঞান কার্ড!</small><div class="kcard">${icon(r.card.icon, 'ico xl')}<b>${esc(r.card.t)}</b><p>${esc(r.card.fact)}</p></div></div>` : ''}
    ${!r.pass && r.meta.kind !== 'practice' ? '<p class="note">আবার শিখে এসে চেষ্টা করলে পারবে।</p>' : ''}
    <div class="row">${r.pass ? '' : `<button class="btn alt" data-act="${r.again}">আবার চেষ্টা</button>`}<button class="btn" data-act="tab" data-v="home">${r.pass ? 'যাত্রায় ফিরি' : 'শিখতে যাই'}</button></div></div>`;
}

// ---------- অনুশীলন ----------
function vPractice() {
  const learned = learnedNodes(), weak = weakItems(6), due = dueCount(), mk = S.mistakes.length;
  const best = (id) => (S.grid[id] ? `সেরা ${bd(S.grid[id].best)} সে.` : 'এখনো খেলোনি');
  const grid = `<div class="panel"><h2>ঝটপট ছক</h2><p>২৫টি ঘর যত দ্রুত পারো ভরো। ভুল হলে ৩ সেকেন্ড বাড়ে। প্রতিদিনের অভ্যাসে নিজের সময়কে হারাও। জাপানের স্কুলে এভাবেই হিসাবে দ্রুত হওয়া শেখানো হয়।</p>
    <div class="gk">${GRID_KINDS.map((k) => `<button class="mini big" data-act="grid-go" data-k="${k.id}"><b>${k.t}</b><small>${best(k.id)}${S.grid[k.id] && S.grid[k.id].stars ? ' · ' + '★'.repeat(S.grid[k.id].stars) : ''}</small></button>`).join('')}</div></div>`;
  const rev = `<div class="panel"><h2>পুনরাবৃত্তি</h2><p>নামতা আর English শব্দ, ভুলে যাওয়ার আগে আবার জিজ্ঞেস করি (১, ২, ৪, ৮ দিন পরপর)। ${due ? `<b>এখন ${bd(due)}টি বাকি।</b>` : 'আজ কিছু বাকি নেই।'}</p>${due ? '<button class="btn big" data-act="review-go">শুরু করি</button>' : '<p class="note">"গণিত যাত্রা" আর "English দক্ষতা" তে নামতা ও শব্দের পাঠ করলে এখানে আসবে।</p>'}</div>`;
  const mixN = mixedPool().length;
  const mix = `<div class="panel"><h2>মিশ্র অভ্যাস</h2><p>শেষ করা স্তরগুলো থেকে একটি করে প্রশ্ন, সব বিষয় মিশিয়ে। কোন নিয়ম কখন লাগে সেটি চেনা এভাবেই পাকা হয়। ${mixN ? `<b>${bd(mixN)}টি স্তর থেকে।</b>` : ''}</p>${mixN >= 2 ? '<button class="btn big" data-act="mix-go">১০টি মিশ্র প্রশ্ন</button>' : '<p class="note">গণিত যাত্রা, বিজ্ঞান, English বা অন্য বইয়ের অন্তত দুটি স্তর পাস করলে এটি খুলবে।</p>'}</div>`;
  const mkp = `<div class="panel"><h2>ভুলের খাতা</h2><p>${mk ? `${bd(mk)}টি প্রশ্ন জমে আছে।` : 'কোনো ভুল জমে নেই।'}</p><div class="row"><button class="btn alt" data-act="mk-open">খাতা দেখি</button>${mk ? '<button class="btn" data-act="mk-go">অভ্যাস করি</button>' : ''}</div></div>`;
  const msn = `<div class="panel"><h2>বাস্তব মিশন</h2><p>হাতে-কলমে কাজ। ঘর, দোকান, পরিবার আর পাড়ায় করার মতো। ${bd(Object.values(S.missions).filter((m) => m.done).length)}টি শেষ।</p><button class="btn alt" data-act="msn-list">মিশন দেখি</button></div>`;
  const prac = learned.length ? `<div class="panel"><h2>মূল পথের অনুশীলন</h2><p>যা শিখেছ তা থেকে ৫টি প্রশ্ন। যেগুলোতে ভুল হয়েছে সেগুলো আগে আসে।</p><button class="btn" data-act="practice-go">শুরু করি</button>${weak.length ? `<div class="chips">${weak.map((it) => `<span>${esc(it.expr || it.ch)}</span>`).join('')}</div>` : ''}</div>` : '';
  return head() + grid + rev + mix + mkp + msn + prac;
}

// ---------- জ্ঞান কার্ড ----------
function vCards() {
  const have = new Set(S.cards);
  const open = V.open && CARDS.find((c) => c.id === V.open);
  return head() + `<h2 class="sec">আমার জ্ঞান কার্ড</h2><p class="lead sm">প্রতিটি পরীক্ষা বা পাঠে প্রথমবার পাস করলে একটি করে কার্ড পাবে। প্রতিটিতে একটি দরকারি কথা আছে।</p>
    <div class="cgrid">${CARDS.map((c) => have.has(c.id)
    ? `<button class="ccard" data-act="copen" data-id="${c.id}">${icon(c.icon, 'ico')}<span>${esc(c.t)}</span></button>`
    : `<div class="ccard off">${ui('lock')}<span>তালা</span></div>`).join('')}</div>
    <p class="note">${bd(S.cards.length)} / ${bd(CARDS.length)} সংগ্রহ হয়েছে</p>
    ${open ? `<div class="modal" data-act="cclose"><div class="kcard" role="dialog" aria-label="${esc(open.t)}">${icon(open.icon, 'ico xl')}<b>${esc(open.t)}</b><p>${esc(open.fact)}</p><div class="row"><button class="btn alt" data-act="chear" data-id="${open.id}">${ui('speaker')}শুনি</button><button class="btn" data-act="cclose">বন্ধ</button></div></div></div>` : ''}`;
}

// ---------- আমি ----------
function vMe() {
  const weak = weakItems(8);
  return head() + `<h2 class="sec">আমার কথা</h2>
    <div class="field"><label for="nm2">নাম</label><input id="nm2" type="text" maxlength="24" value="${esc(S.name)}" autocomplete="off"></div>
    ${rankCard()}
    <div class="row"><button class="btn alt" data-act="report-open">আমার শেখার রিপোর্ট</button></div>
    <div class="panel"><h3>একাউন্ট</h3>${loggedIn() ? `<p>লগইন: <b dir="ltr">${esc(S.account.user)}</b></p>` : '<p>লগইন করলে ফোন বদলালেও আগের লেভেল থেকেই শুরু করতে পারবে।</p>'}<div class="row"><button class="btn ${loggedIn() ? 'alt' : ''}" data-act="ac-open">${loggedIn() ? 'একাউন্ট দেখি' : 'লগইন / নতুন একাউন্ট'}</button></div></div>
    <div class="label">আমার বয়স</div>
    <div class="seg ages">${AGES.map(([v, l]) => `<button data-act="setage" data-v="${v}" aria-pressed="${ageBand() === v}">${l}</button>`).join('')}</div>
    <div class="label">আমার বন্ধু</div>
    <div class="modes three"><button class="mode" data-act="setmode" data-m="boy" aria-pressed="${mode() === 'boy'}">${mascot('boy', 'happy', 'm-md')}<b>রোবট</b></button><button class="mode" data-act="setmode" data-m="girl" aria-pressed="${mode() === 'girl'}">${mascot('girl', 'happy', 'm-md')}<b>প্রজাপতি</b></button><button class="mode" data-act="setmode" data-m="teen" aria-pressed="${mode() === 'teen'}">${mascot('teen', 'happy', 'm-md')}<b>আধুনিক</b></button></div>
    <div class="label">শব্দ ও কথা</div>
    <div class="toggles"><button class="tg" data-act="sound" aria-pressed="${S.sound}">${ui('speaker')}শব্দ ${S.sound ? 'চালু' : 'বন্ধ'}</button><button class="tg" data-act="rate" aria-pressed="${S.rate <= 0.7}">কথা ${S.rate <= 0.7 ? 'ধীরে' : 'স্বাভাবিক'}</button></div>
    <div class="panel stats"><div><span>পাস করা ধাপ</span><b>${bd(passedCount())}</b></div><div><span>মোট তারা</span><b>${bd(totalStars())}</b></div><div><span>জ্ঞান কার্ড</span><b>${bd(S.cards.length)}</b></div><div><span>ধারাবাহিক দিন</span><b>${bd(streak())}</b></div></div>
    <div class="label">ব্যাজ (${bd(earned().length)}/${bd(BADGES.length)})</div>${badgeGrid()}
    ${weak.length ? `<div class="panel"><h3>যা আরও অভ্যাস করা ভালো</h3><div class="chips">${weak.map((it) => `<span>${esc(it.expr || it.ch)}</span>`).join('')}</div></div>` : ''}
    <div class="label">আমার আগ্রহ</div>${interestChips(S.interests)}
    <div class="row"><button class="btn alt" data-act="parent-open">${ui('gear')}অভিভাবকের জন্য</button></div>
    <p class="note">অফলাইনেও সব চলে। লগইন করা থাকলে ইন্টারনেট এলে অগ্রগতি নিজে নিজে সিঙ্ক হয়।</p>`;
}

// ---------- সময়, আগ্রহ ও সহায়ক পর্দা ----------
const listFor = (w) => (w === 'ai' ? S.ai.lessons : TOPICS[w] || []);
function freePill() {
  const f = freeLeft();
  return f > 0 ? `<span class="pill free" aria-label="ফোন খোলা আছে">${ui('phone')}<b class="js-free">${fmt(f)}</b></span>` : '';
}
function banner() {
  if (capReached()) return `<div class="banner">আজকের ${bd(S.parent.cap)}টি লেভেল শেষ! কাল আবার এসো।</div>`;
  if (restLeft() > 0) return `<div class="banner">বিশ্রামের সময়। আবার শেখা যাবে: <b class="js-rest">${fmt(restLeft())}</b></div>`;
  return '';
}
function interestChips(sel) {
  return `<div class="ichips">${INTERESTS.map((i) => `<button class="ichip" data-act="int" data-id="${i.id}" aria-pressed="${sel.includes(i.id)}">${icon(i.icon, 'ico')}<span>${i.n}</span></button>`).join('')}</div>`;
}
function planCard() {
  const p = dailyPlan();
  if (!p.items.length) return recoCard();
  return `<div class="plan"><h3>আজকের পরিকল্পনা <small>${bd(p.done)}/${bd(p.items.length)}</small></h3>${p.items.map((x, k) => `<button class="pl ${x.done ? 'on' : ''}" data-act="plan" data-k="${k}">${x.done ? ui('check') : '<i></i>'}<span><b>${esc(x.t)}</b><small>${esc(x.sub)}</small></span></button>`).join('')}</div>`;
}
function planGo(it) {
  if (!it) return;
  if (it.k === 'tm') {
    if (gated()) return;
    const t = topicById(it.id); if (!t) return;
    const qs = topicQs(t).slice(0, 6);
    startQuiz('review', qs, { kind: 'review', tid: t.id });
  } else if (it.k === 'srs') { if (gated()) return; const qs = reviewQuestions(8); if (!qs.length) { toast('আজ কিছু বাকি নেই'); return; } startQuiz('review', qs, { kind: 'review' }); }
  else if (it.k === 'wk') planWeak();
  else if (it.k === 'mk') go('mistakes');
  else if (it.k === 'grid') setTab('practice');
  else if (it.k === 'new') {
    if (it.id) openTopic(it.id, it.w);
    else { if (gated()) return; stack = [{ view: 'home' }]; V = { view: 'node', s: it.w, i: it.i }; render(); }
  }
}
function planWeak() { if (gated()) return; const qs = skillQuestions(2, 4); if (qs.length < 2) { toast('এখনো দুর্বল ধরন পাওয়া যায়নি'); return; } startQuiz('review', qs, { kind: 'review' }); }
function recoCard() {
  const r = recommend();
  if (!r.length) return '';
  return `<div class="reco"><h3>আজ তোমার জন্য</h3><div class="rlist">${r.map((x, k) => `<button class="rc" data-act="reco" data-k="${k}">${x.kind === 'topic' ? icon(x.icon, 'ico') : ui('map', 'ui lg')}<b>${esc(x.t)}</b><small>${x.sub}</small></button>`).join('')}</div>${S.ai.on ? `<button class="mini" data-act="ask-open">${ui('speaker')}আমাকে জিজ্ঞেস করো</button>` : ''}</div>`;
}
function gated() {
  const g = gate();
  if (g.ok) return false;
  go('rest', { why: g.why });
  return true;
}
function tcard(t, list, w) {
  const un = topicUnlocked(t, list), dn = topicDone(t.id);
  const why = !un ? (ageBand() <= 2 && level() < (t.req || 1) ? `লেভেল ${bd(t.req)} লাগবে` : 'আগের পাঠ শেষ করো') : '';
  return `<button class="tcard ${dn ? 'done' : un ? '' : 'lock'}" data-act="topic" data-id="${t.id}" data-w="${w}">${dn ? `<i class="tick">${ui('check')}</i>` : ''}${t.ai ? '<i class="aib">AI</i>' : ''}${icon(t.icon, 'ico')}<b>${esc(t.t)}</b><span class="tags">${(t.tags || []).map((g) => `<i>${esc(INTEREST_NAME[g] || g)}</i>`).join('')}</span>${why ? `<small class="need">${ui('lock')}${why}</small>` : ''}</button>`;
}
function vHome() {
  const w = WORLD[S.world] && (S.world !== 'ai' || S.ai.on || S.ai.lessons.length) ? S.world : 'bn';
  const tabs = WORLDS.filter((x) => (x.id !== 'ai' || S.ai.on || S.ai.lessons.length) && !((x.id === 'cr' || x.id === 'cd' || x.id === 'sp') && ageBand() <= 2 && !worldUnlocked(x.id))).map((x) => {
    const un = worldUnlocked(x.id);
    return `<button class="wtab ${un ? '' : 'locked'}" role="tab" data-act="world" data-w="${x.id}" aria-selected="${w === x.id}">${un ? '' : `<i class="lk">${ui('lock')}</i>`}<b>${x.name}</b><small>${x.tag}</small></button>`;
  }).join('');
  let body = '';
  if (!worldUnlocked(w)) {
    const why = worldWhy(w);
    body = `<div class="panel lockedmsg">${ui('lock', 'ui xl')}<h2>এই বই এখন তালা দেওয়া</h2><p>${why}</p></div>`;
  } else if (WORLD[w].kind === 'topic') {
    const list = listFor(w), linear = list.length && list[0].linear;
    const order = linear || (list.length && list[0].ordered) ? list.slice() : list.slice().sort((a, b) => (topicDone(a.id) ? 1 : 0) - (topicDone(b.id) ? 1 : 0) || topicScore(b) - topicScore(a) || (a.req || 1) - (b.req || 1));
    const done = list.filter((t) => topicDone(t.id)).length;
    body = `<div class="panel"><h2>${WORLD[w].name}: ${bd(done)}/${bd(list.length)} পাঠ শেষ</h2><p>${w === 'ai' ? 'এগুলো AI তোমার আগ্রহ আর স্তর বুঝে বানিয়েছে। বড়দের একটু দেখে নিতে বলো।' : w === 'mh' ? 'প্রতিটি স্তরে ৮টি প্রশ্ন, পাস করতে ৮০% ঠিক লাগে। আগে শিখি, তারপর নিজে করি। কঠিন লাগলে আগের স্তরে ফিরে অভ্যাস করো।' : 'প্রতিটি পাঠে কয়েকটি কথা পড়ে প্রশ্নের উত্তর দিতে হয়। পাস করতে প্রায় ৮০% ঠিক লাগে।'}</p></div>
      ${w === 'mh' ? '<div class="row"><button class="btn alt" data-act="probe-start">আমার স্তর খুঁজি</button></div>' : ''}
      ${w === 'ai' && S.ai.on ? `<div class="row"><button class="btn" data-act="ai-gen" ${V.busy ? 'disabled' : ''}>${V.busy ? 'বানাচ্ছি…' : 'আমার জন্য নতুন পাঠ'}</button></div>${V.aiErr ? `<p class="note bad">${esc(V.aiErr)}</p>` : ''}` : ''}
      <div class="tgrid">${order.map((t) => tcard(t, list, w)).join('') || '<p class="note">এখনো কোনো পাঠ নেই।</p>'}</div>`;
  } else {
    const sj = SUBJECTS[w];
    const done = sj.nodes.filter((n, i) => nodeDone(w, i)).length;
    body = `<div class="panel"><h2>${sj.name}: ${bd(done)}/${bd(sj.nodes.length)} ধাপ শেষ</h2><p>প্রতিটি ধাপে শিখি, লিখি, খেলি আর পরীক্ষা দিই। পরীক্ষায় পাস করলে পরের ধাপ খোলে।</p></div>
    <ol class="path">${sj.nodes.map((n, i) => {
      const un = nodeUnlocked(w, i), dn = nodeDone(w, i), stars = S.stars[nk(w, i)] || 0;
      const st = !un ? 'lock' : dn ? 'done' : 'cur';
      return `<li><button class="node ${st}" style="--o:${[0, 1, 0, -1][i % 4]}" data-act="node" data-s="${w}" data-i="${i}">${discHtml(st, bd(i + 1))}<span class="nt">${esc(n.t)}</span><span class="stars">${[0, 1, 2].map((k) => starIcon(k < stars)).join('')}</span></button></li>`;
    }).join('')}</ol>
    <p class="soon">আরও ধাপ তৈরি হচ্ছে। "আমার জন্য" বইয়ে AI নতুন পাঠ বানাতে পারে।</p>`;
  }
  return head() + banner() + questCard() + planCard() + `<div class="wtabs" role="tablist">${tabs}</div>` + body;
}
function openTopic(id, w) {
  const list = listFor(w), t = list.find((x) => x.id === id);
  if (!t) return;
  if (!topicUnlocked(t, list)) { toast(ageBand() <= 2 && level() < (t.req || 1) ? `লেভেল ${bd(t.req)} হলে খুলবে` : 'আগের পাঠ শেষ করলে খুলবে'); sfx.bad(); return; }
  if (gated()) return;
  sfx.tap(); stack = [{ view: 'home' }]; V = { view: 'lesson', t, c: 0 }; render();
}

// ---------- পাঠ (কার্ড পড়া, তারপর প্রশ্ন) ----------
function vLesson() {
  const l = V.t, c = V.c, last = c === l.cards.length - 1;
  const prog = l.cards.map((x, j) => `<i class="${j < c ? 'on' : j === c ? 'now' : ''}"></i>`).join('');
  return `<div class="screen">${backBtn('home', 'যাত্রা')}<h1 class="ttl">${esc(l.t)}</h1><div class="progress">${prog}</div>
    <div class="plate lesson">${icon(l.icon, 'ico xl')}<p class="lesson-t">${esc(l.cards[c])}</p></div>
    <div class="row">${c > 0 ? '<button class="btn alt" data-act="lprev">আগের</button>' : ''}${topicDone(l.id) ? '' : '<button class="btn alt" data-act="skip-test">আগে থেকেই জানি, সরাসরি প্রশ্ন</button>'}<button class="btn alt" data-act="lhear">${ui('speaker')}শুনি</button></div>
    <div class="row"><button class="btn go" data-act="lnext">${last ? 'প্রশ্নে যাই' : 'পরের কথা'}</button></div></div>`;
}
function topicQs(t) {
  return buildQuestions(t).map((q, k) => ({ id: q.id || `${t.id}:${k}`, p: q.p, opts: q.o.map((h, v) => ({ v, h })), ans: q.a, why: q.why, show: q.show, say: q.say, lang: q.lang || 'bn-BD', sk: q.sk }));
}
function startTopicQuiz(t) {
  const qs = topicQs(t);
  startQuiz('topic', qs, { kind: 'topic', id: t.id, w: t.w, tags: t.tags, t });
}

// ---------- বিশ্রাম ----------
function vRest() {
  const cap = V.why === 'cap';
  return `<div class="screen result"><div class="hero bounce">${mascot(mode(), 'happy', 'm-xl')}</div>
    <h1>${cap ? 'আজকের জন্য যথেষ্ট!' : 'বিশ্রামের সময়'}</h1>
    <p class="lead">${cap ? `আজ ${bd(S.parent.cap)}টি লেভেল শেষ করেছ। ভালো করেছ! কাল আবার এসো।` : 'একটানা শিখলে মাথা ক্লান্ত হয়। একটু বিশ্রাম নিলে পরের পাঠ ভালো মনে থাকে।'}</p>
    ${cap ? '' : `<div class="clock js-rest">${fmt(restLeft())}</div>`}
    <div class="panel"><h3>এই সময়ে করতে পারো</h3><p>এক গ্লাস পানি খাও। জানালা দিয়ে বাইরে তাকাও। একটু হাঁটো বা খেলো।</p>${freeLeft() > 0 ? `<p>ফোনের সময় বাকি: <b class="js-free">${fmt(freeLeft())}</b></p>` : ''}</div>
    <div class="row"><button class="btn" data-act="tab" data-v="home">ফিরে যাই</button><button class="btn alt" data-act="parent-open">${ui('gear')}অভিভাবক</button></div></div>`;
}

// ---------- অভিভাবকের পিন ----------
function vPin() {
  const titles = { enter: 'অভিভাবকের পিন দিন', set: 'নতুন পিন বাছুন (৪ সংখ্যা)', confirm: 'আবার একই পিন দিন' };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'b'];
  return `<div class="screen welcome">${V.first ? '' : backBtn('back', 'ফিরি')}<div class="hero">${icon('shield', 'ico xl')}</div>
    <h1 style="font-size:26px">${titles[V.mode]}</h1>
    ${V.first ? '<p class="lead sm">এই পিন দিয়ে ফোনের সময়, বিশ্রাম আর AI এর সেটিং শুধু অভিভাবক বদলাতে পারবেন।</p>' : ''}
    <div class="pindots" aria-label="${bd(V.buf.length)}টি সংখ্যা দেওয়া হয়েছে">${[0, 1, 2, 3].map((k) => `<b class="${k < V.buf.length ? 'on' : ''}"></b>`).join('')}</div>
    <div class="say ${V.cls || ''}" aria-live="polite">${V.msg || ''}</div>
    <div class="keypad">${keys.map((k) => (k === '' ? '<span></span>' : `<button data-act="pk" data-k="${k}" aria-label="${k === 'b' ? 'মুছি' : k}">${k === 'b' ? ui('left') : bd(k)}</button>`)).join('')}</div>
    ${V.first ? '<div class="row"><button class="btn alt" data-act="pin-skip">পরে করব</button></div><p class="note">পিন না দিলে ফোন আটকানোর সুবিধা চালু হবে না। পরে "আমি" ট্যাব থেকে দেওয়া যাবে।</p>' : ''}</div>`;
}
async function pinKey(k) {
  if (k === 'b') V.buf = V.buf.slice(0, -1); else if (V.buf.length < 4) V.buf += k;
  V.msg = ''; V.cls = '';
  if (V.buf.length < 4) { render(); return; }
  const buf = V.buf;
  if (V.mode === 'enter') {
    if (await checkPin(buf)) { sfx.ok(); stack.pop(); V = { view: 'parent' }; render(); refreshStatus(); return; }
    V.buf = ''; V.msg = 'পিন ঠিক নয়।'; V.cls = 'bad'; sfx.bad(); render(); return;
  }
  if (V.mode === 'set') { V.pin1 = buf; V.mode = 'confirm'; V.buf = ''; render(); return; }
  if (buf === V.pin1) {
    await setPin(buf); sfx.win(); toast('পিন ঠিক করা হয়েছে');
    if (V.first) { setTab('home'); } else { V = { view: 'parent' }; render(); refreshStatus(); }
    return;
  }
  V.mode = 'set'; V.buf = ''; V.msg = 'দুটি পিন মেলেনি। আবার বাছুন।'; V.cls = 'bad'; sfx.bad(); render();
}

// ---------- অভিভাবকের এলাকা ----------
async function refreshStatus() {
  const st = await nativeStatus();
  if (V.view === 'parent') { V.st = st; render(); }
}
const seg = (k, opts, cur, unit) => `<div class="seg">${opts.map((v) => `<button data-act="pset" data-k="${k}" data-v="${v}" aria-pressed="${cur === v}">${bd(v)}${unit}</button>`).join('')}</div>`;
function vParent() {
  const st = V.st || {};
  const lock = S.parent.lock;
  const lockInfo = !native
    ? '<p class="note">ফোন আটকানোর সুবিধা শুধু Android ফোনে কাজ করে। এখানে শুধু অ্যাপের ভেতরের সময় গোনা হচ্ছে।</p>'
    : `<div class="perm"><span>ব্যবহারের তথ্যের অনুমতি</span><b class="${st.usage ? 'ok' : 'bad'}">${st.usage ? 'আছে' : 'নেই'}</b>${st.usage ? '' : '<button class="mini" data-act="p-usage">অনুমতি দিন</button>'}</div>
       <div class="perm"><span>অন্য অ্যাপের ওপরে দেখানোর অনুমতি</span><b class="${st.overlay ? 'ok' : 'bad'}">${st.overlay ? 'আছে' : 'নেই'}</b>${st.overlay ? '' : '<button class="mini" data-act="p-overlay">অনুমতি দিন</button>'}</div>
       <button class="mini" data-act="p-recheck">${ui('redo')}আবার দেখি</button>`;
  const weak = weakItems(6), top = topInterests(4);
  const rows = ['bn', 'en', 'mt'].map((w) => `<div><span>${SUBJECTS[w].name}</span><b>${bd(SUBJECTS[w].nodes.filter((n, i) => nodeDone(w, i)).length)}/${bd(SUBJECTS[w].nodes.length)}</b></div>`).join('')
    + ['mh', 'sp', 'ee', 'bl', 'cr', 'cd', 'life', 'sc', 'sk', 'ai'].map((w) => `<div><span>${WORLD[w].name}</span><b>${bd(listFor(w).filter((t) => topicDone(t.id)).length)}/${bd(listFor(w).length)}</b></div>`).join('');
  return `<div class="screen">${backBtn('home', 'বের হই')}<h1 class="ttl">অভিভাবকের এলাকা</h1>
  <div class="panel"><h3>ফোনের সময় ও বিশ্রাম</h3>
    <p>লেভেল পার করলে শিশু এই সময় ফোন চালাতে পারবে। তারপর বিশ্রাম।</p>
    <div class="label sm">ফোন চালানোর সময় (প্রতি লেভেলে)</div>${seg('free', [5, 10, 15, 20], S.parent.free, ' মিনিট')}
    <div class="label sm">বিশ্রামের সময় (লেভেলের পরে)</div>${seg('rest', [5, 10, 15, 20, 30], S.parent.rest, ' মিনিট')}
    <div class="label sm">দিনে সর্বোচ্চ লেভেল</div>${seg('cap', [3, 4, 6, 8, 10], S.parent.cap, 'টি')}
    <p class="note" style="text-align:left">দিনের লেভেল শেষ হলে বাকি দিন অন্য অ্যাপ আর আটকানো থাকে না।</p>
    <div class="row"><button class="btn alt" data-act="p-grant">+ ${bd(10)} মিনিট ফোন দিন</button><button class="btn alt" data-act="p-clear-rest" ${restLeft() ? '' : 'disabled'}>বিশ্রাম বাদ দিন</button></div>
    ${freeLeft() > 0 ? `<p class="note">এখন ফোন খোলা: <b class="js-free">${fmt(freeLeft())}</b></p>` : ''}</div>
  <div class="panel"><h3>অন্য অ্যাপ আটকানো</h3>
    <button class="tg wide" data-act="plock" aria-pressed="${lock}">${ui('lock')}আটকানো ${lock ? 'চালু' : 'বন্ধ'}</button>
    ${lockInfo}
    <p class="note" style="text-align:left">চালু থাকলে সময় শেষ হলে শিশুকে এই অ্যাপে ফিরিয়ে আনা হয়। ফোন কল আর জরুরি কাজ চলে। বন্ধ করতে এখানে এসে বন্ধ করুন।</p></div>
  <div class="panel"><h3>শিশুর আগ্রহ</h3>${interestChips(S.interests)}
    ${top.length ? `<p>এখন বেশি আগ্রহ: ${top.map((x) => esc(x.n)).join(', ')}</p>` : ''}</div>
  <div class="panel"><h3>এই সপ্তাহের সারাংশ</h3>${(() => { const w = weekly(); const mx = Math.max(1, ...w.bars); return `<div class="wk">${w.bars.map((b) => `<i style="height:${6 + Math.round(34 * b / mx)}px" class="${b ? 'on' : ''}"></i>`).join('')}</div>
    <p>শিখেছে ${bd(w.active)} দিন (গত ৭ দিনে)। পাস ${bd(w.pass)}টি, অনুশীলন ${bd(w.review)}বার, ঝটপট ছক ${bd(w.grid)}বার।${w.acc !== null ? ` সঠিকের হার ${bd(Math.round(w.acc * 100))}%।` : ''}</p>
    ${w.due ? `<p class="note" style="text-align:left">${bd(w.due)}টি পাঠ ঝালাই করার সময় হয়েছে।</p>` : ''}
    ${w.weak.length ? `<p class="note" style="text-align:left">আরও সময় দরকার: ${w.weak.map((x) => esc(x.t)).join(', ')}</p>` : ''}`; })()}</div>
  <div class="panel"><h3>অগ্রগতি</h3><div class="stats">${rows}</div>
    ${weak.length ? `<div class="label sm">আরও অভ্যাস দরকার</div><div class="chips">${weak.map((it) => `<span>${esc(it.expr || it.ch)}</span>`).join('')}</div>` : ''}</div>
  <div class="panel"><h3>AI সহায়ক (ঐচ্ছিক)</h3>
    <p>চালু করলে AI শিশুর আগ্রহ অনুযায়ী নতুন পাঠ বানাবে আর শিশুর প্রশ্নের উত্তর দেবে। ইন্টারনেট ছাড়া অ্যাপ নিজের পাঠ দিয়েই চলে। বানানো পাঠ ফোনে জমা থাকে।</p>
    <button class="tg wide" data-act="ai-on" aria-pressed="${S.ai.on}">AI ${S.ai.on ? 'চালু' : 'বন্ধ'}</button>
    <div class="seg"><button data-act="ai-prov" data-v="anthropic" aria-pressed="${S.ai.provider === 'anthropic'}">Anthropic</button><button data-act="ai-prov" data-v="openai" aria-pressed="${S.ai.provider === 'openai'}">OpenAI সমতুল্য</button></div>
    <div class="field"><label for="ai-key">API কী</label><input id="ai-key" type="password" autocomplete="off" value="${esc(S.ai.key)}" placeholder="sk-…"></div>
    <div class="field"><label for="ai-model">মডেলের নাম</label><input id="ai-model" type="text" autocomplete="off" value="${esc(S.ai.model)}"></div>
    <div class="field"><label for="ai-base">ঠিকানা (ঐচ্ছিক)</label><input id="ai-base" type="text" autocomplete="off" value="${esc(S.ai.base)}" placeholder="${S.ai.provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com'}"></div>
    <div class="row"><button class="btn alt" data-act="ai-test" ${V.busy ? 'disabled' : ''}>${V.busy ? 'দেখছি…' : 'যোগাযোগ পরীক্ষা'}</button></div>
    ${V.aiMsg ? `<p class="note ${V.aiOk ? 'ok' : 'bad'}">${esc(V.aiMsg)}</p>` : ''}
    <p class="note" style="text-align:left">API কী শুধু এই ফোনে থাকে। শিশুর প্রশ্ন আর পাঠের অনুরোধ আপনার বেছে নেওয়া সেবায় যায়। সেবার খরচ আপনার। বানানো পাঠ নিচে দেখে মুছে ফেলতে পারবেন।</p>
    ${S.ai.lessons.length ? `<div class="label sm">AI এর বানানো পাঠ</div>${S.ai.lessons.map((l) => `<div class="aitem"><span>${esc(l.t)}</span><button class="mini" data-act="ai-del" data-id="${l.id}">মুছি</button></div>`).join('')}` : ''}</div>
  <div class="panel"><h3>পিন ও নতুন করে শুরু</h3>
    <div class="panel"><h3>বাস্তব মিশনে শিশুর লেখা</h3>${Object.entries(S.missions).filter(([, m]) => m.done).map(([id, m]) => { const d = MISSIONS.find((x) => x.id === id); return `<div class="aitem col"><b>${esc(d ? d.t : id)}</b><span>${esc(m.note)}</span></div>`; }).join('') || '<p class="note">এখনো কোনো মিশন শেষ হয়নি।</p>'}</div>
    <div class="panel"><h3>বয়স আর একাউন্ট</h3><p>বয়সের স্তর: <b>${AGES.find((x) => x[0] === ageBand())[1]}</b> (পাঠের ক্রম ও সুপারিশ এর ওপর নির্ভর করে)। ${loggedIn() ? `একাউন্ট: <span dir="ltr">${esc(S.account.user)}</span>` : 'একাউন্টে লগইন করা নেই।'}</p></div>
    <div class="row"><button class="btn alt" data-act="pin-change">পিন বদলাই</button><button class="btn alt" data-act="reset">${V.confirm ? 'নিশ্চিত? সব মুছে যাবে' : 'নতুন করে শুরু'}</button></div></div></div>`;
}

// ---------- জিজ্ঞেস করো ----------
function vAsk() {
  return `<div class="screen">${backBtn('home', 'ফিরি')}<h1 class="ttl">আমাকে জিজ্ঞেস করো</h1>
    <p class="lead sm">${S.ai.on ? 'যা জানতে চাও লেখো। ইন্টারনেট থাকলে উত্তর পাবে।' : 'এই সুবিধা এখন বন্ধ। অভিভাবক চালু করতে পারেন।'}</p>
    <div class="field"><label for="ask-q">তোমার প্রশ্ন</label><input id="ask-q" type="text" maxlength="200" autocomplete="off" value="${esc(V.q || '')}" placeholder="যেমন: আকাশ নীল কেন?"></div>
    <div class="row"><button class="btn" data-act="ask-go" ${V.busy || !S.ai.on ? 'disabled' : ''}>${V.busy ? 'ভাবছি…' : 'জিজ্ঞেস করি'}</button></div>
    ${V.ans ? `<div class="plate" style="margin-top:14px"><p class="lesson-t" style="font-size:20px">${esc(V.ans)}</p><button class="mini" data-act="ask-hear">${ui('speaker')}শুনি</button><p class="note">AI ভুল করতে পারে। দরকারি কথা বড়দের জিজ্ঞেস করো।</p></div>` : ''}
    ${V.err ? `<p class="note bad">${esc(V.err)}</p>` : ''}</div>`;
}

// ---------- ঝটপট ছক ----------
function startGrid(kind) {
  if (gated()) return;
  go('grid', { g: makeGrid(kind), i: 0, t0: 0, errs: 0, fix: false, buf: '' });
}
function vGrid() {
  const g = V.g, n = g.size, k = GRID_KINDS.find((x) => x.id === g.kind);
  const cells = g.cells.map((c, idx) => {
    const cur = idx === V.i, wrong = V.fix && c.v !== '' && +c.v !== c.ans;
    const txt = cur ? (V.buf || '') : c.v;
    return `<span class="gc ${cur ? 'cur' : ''} ${wrong ? 'bad' : ''} ${c.v !== '' && !cur && !wrong ? 'ok' : ''}">${txt === '' ? '' : bd(txt)}</span>`;
  });
  const rowsHtml = g.rows.map((r, ri) => `<span class="gh">${bd(r)}</span>${cells.slice(ri * n, ri * n + n).join('')}`).join('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'b', '0', ''];
  const cur = g.cells[V.i];
  const opHint = g.kind === 'mix' ? '' : '';
  return `<div class="screen">${backBtn('quit', 'বের হই')}<h1 class="ttl">ঝটপট ছক: ${k.t}</h1>
    <p class="note">${V.fix ? 'লাল ঘরগুলো ঠিক করো। ' : ''}সময়: <b class="js-gt">${V.t0 ? bd(Math.floor((Date.now() - V.t0) / 1000)) : '০'}</b> সেকেন্ড · ভুল: ${bd(V.errs)}</p>
    <div class="ggrid" style="--n:${n}"><span class="gh corner">${g.kind === 'mix' ? '±' : k.op}</span>${g.cols.map((c) => `<span class="gh">${bd(c)}</span>`).join('')}${rowsHtml}</div>
    <p class="gq">${cur ? `${bd(cur.a)} ${cur.o} ${bd(cur.b)} = ?` : ''}</p>
    <div class="keypad">${keys.map((x) => (x === '' ? '<span></span>' : `<button data-act="gk" data-k="${x}" aria-label="${x === 'b' ? 'মুছি' : x}">${x === 'b' ? ui('left') : bd(x)}</button>`)).join('')}</div></div>`;
}
function gridKey(kk) {
  const g = V.g, c = g.cells[V.i];
  if (!c) return;
  if (kk === 'b') { V.buf = V.buf.slice(0, -1); render(); return; }
  if (!V.t0) V.t0 = Date.now();
  V.buf += kk;
  if (V.buf.length < String(c.ans).length) { render(); return; }
  c.v = V.buf; V.buf = '';
  const ok = +c.v === c.ans;
  if (!V.fix && !ok) V.errs++;
  if (ok) sfx.tap(); else sfx.bad();
  let nextIdx;
  if (V.fix) {
    const wrongs = g.cells.map((x, j) => (+x.v !== x.ans ? j : -1)).filter((j) => j >= 0);
    nextIdx = wrongs.length ? wrongs[0] : -1;
    if (nextIdx >= 0 && g.cells[nextIdx].v !== '') g.cells[nextIdx].v = '';
  } else {
    nextIdx = V.i + 1;
    if (nextIdx >= g.cells.length) {
      const wrongs = g.cells.map((x, j) => (+x.v !== x.ans ? j : -1)).filter((j) => j >= 0);
      if (wrongs.length) { V.fix = true; nextIdx = wrongs[0]; g.cells[nextIdx].v = ''; } else nextIdx = -1;
    }
  }
  if (nextIdx < 0) { finishGrid(); return; }
  V.i = nextIdx; render();
}
function finishGrid() {
  const sec = (Date.now() - V.t0) / 1000 + V.errs * 3;
  const kind = V.g.kind, r = gridDone(kind, sec);
  const xp = 10 + r.stars * 5; addXP(xp); bump('grid');
  const lines = [`সময় ${bd(Math.round(sec))} সেকেন্ড (প্রতিটি ভুলে ৩ সেকেন্ড যোগ)`, r.prev ? (r.improved ? `আগের সেরা ${bd(r.prev)} সেকেন্ড থেকে ${bd(Math.round(r.prev - sec))} সেকেন্ড কম!` : `তোমার সেরা এখনো ${bd(r.prev)} সেকেন্ড। আবার চেষ্টা করলে হারাতে পারবে।`) : 'এটি তোমার প্রথম সময়। এবার এটিকে হারানোই লক্ষ্য!'];
  sfx.win(); if (r.stars >= 2) confetti();
  const bonus = questBonus(), badges = newBadges(); save();
  stack = [];
  V = { view: 'result', res: { pass: true, score: 0, n: 0, stars: r.stars, xp, lines, bonus, badges, card: null, again: 'practice', meta: { kind: 'practice' }, title: 'ঝটপট ছক শেষ!' } };
  render();
}

// ---------- ভুলের খাতা ও পুনরাবৃত্তি ----------
function vReport() {
  const r = report(), pc = (x) => bd(Math.round(x * 100)) + '%';
  const rows = r.rows.map((x) => `<div class="rrow"><span>${esc(x.name)}</span><div class="bar"><i style="width:${x.total ? Math.round(100 * x.done / x.total) : 0}%"></i></div><small>${bd(x.done)}/${bd(x.total)}${x.eff !== null ? ' · মনে আছে ' + pc(x.eff) : ''}${x.due ? ' · ঝালাই ' + bd(x.due) : ''}</small></div>`).join('');
  const li = (a) => a.map((x) => `<li>${esc(x.t)} <small>(${pc(x.e)})</small></li>`).join('');
  return head() + `<div class="screen">${backBtn('back', 'ফিরি')}<h1 class="ttl">আমার শেখার রিপোর্ট</h1>
    <div class="panel stats"><div><span>মোট সঠিক</span><b>${bd(r.correct)}</b></div><div><span>মোট ভুল</span><b>${bd(r.wrong)}</b></div><div><span>সঠিকের হার</span><b>${r.acc === null ? '–' : pc(r.acc)}</b></div><div><span>ঝালাই বাকি</span><b>${bd(r.due)}</b></div></div>
    <div class="panel"><h3>বই অনুযায়ী অগ্রগতি</h3>${rows || '<p class="note">এখনো কোনো পাঠ শেষ হয়নি।</p>'}<p class="note">"মনে আছে" হলো তোমার উত্তরের ইতিহাস আর কতদিন আগে শিখেছ, এই দুটি থেকে হিসাব করা অনুমান। প্রতিটি পাঠ অন্তত ৩টি প্রশ্নে উত্তর দেওয়ার পর গোনা হয়।</p></div>
    ${r.strong.length ? `<div class="panel"><h3>সবচেয়ে ভালো পারো</h3><ul class="rl">${li(r.strong)}</ul></div>` : ''}
    ${r.skills.length ? `<div class="panel"><h3>বারবার ভুল হয় যে ধরনে</h3><ul class="rl">${r.skills.map((x) => `<li>${esc(x.t.t.replace(/^[০-৯]+\. /, ''))} <small>(সঠিক ${pc(x.p)}, ${bd(x.n)}টি প্রশ্ন)</small></li>`).join('')}</ul><div class="row"><button class="btn alt" data-act="weak-go">এই ধরনের প্রশ্ন অনুশীলন</button></div></div>` : ''}
    ${r.weak.length ? `<div class="panel"><h3>আরও অভ্যাস দরকার</h3><ul class="rl">${li(r.weak)}</ul><p class="note">এগুলো "আজকের পরিকল্পনায়" ঘুরে ঘুরে আসবে।</p></div>` : ''}</div>`;
}
function vMistakes() {
  const list = S.mistakes;
  return `<div class="screen">${backBtn('back', 'ফিরি')}<h1 class="ttl">ভুলের খাতা</h1>
    <p class="note">যে প্রশ্নে ভুল হয়েছে সেগুলো এখানে জমা থাকে। প্রতিটি দুইবার ঠিক করলে খাতা থেকে চলে যায়। জাপানের শিক্ষার্থীরা একে "ভুলের খাতা" বলে, ভুল থেকেই সবচেয়ে বেশি শেখা হয়।</p>
    ${list.length ? `<div class="row"><button class="btn big" data-act="mk-go">${bd(Math.min(5, list.length))}টি অভ্যাস করি</button></div>
    <div class="mlist">${list.map((m) => `<div class="mitem"><b>${esc(m.p)}</b><span>ঠিক উত্তর: ${esc(m.o[m.a])}</span>${m.why ? `<small>${esc(m.why)}</small>` : ''}<i>${bd(m.ok)}/২ বার ঠিক</i></div>`).join('')}</div>` : `<div class="panel lockedmsg">${mascot(mode(), 'cheer', 'm-lg')}<h2>খাতা খালি!</h2><p>কোনো ভুল জমে নেই। পাঠে ভুল হলে এখানে আসবে।</p></div>`}</div>`;
}

// ---------- মিশন ----------
function vMissions() {
  const list = missionsFor();
  const done = list.filter((m) => S.missions[m.id] && S.missions[m.id].done).length;
  return `<div class="screen">${backBtn('back', 'ফিরি')}<h1 class="ttl">বাস্তব মিশন</h1>
    <p class="note">বই থেকে শেখা এক জিনিস, নিজে করে দেখা আরেক। এই কাজগুলো অ্যাপের বাইরে করতে হয়, বড়দের সাথে বা অনুমতি নিয়ে। শেষে নিজের কথায় লিখতে হয়। ${bd(done)}/${bd(list.length)} শেষ।</p>
    <div class="mlist">${list.map((m) => { const d = S.missions[m.id] && S.missions[m.id].done; return `<button class="msn ${d ? 'done' : ''}" data-act="msn" data-id="${m.id}">${icon(m.icon, 'ico')}<span><b>${esc(m.t)}</b><small>${d ? 'শেষ হয়েছে' : `+${bd(m.xp)} অভিজ্ঞতা`}</small></span>${d ? ui('check') : ''}</button>`; }).join('')}</div></div>`;
}
function vMission() {
  const m = V.m, d = S.missions[m.id] && S.missions[m.id].done;
  return `<div class="screen">${backBtn('back', 'মিশনে ফিরি')}<h1 class="ttl">${esc(m.t)}</h1>
    <div class="panel"><p><b>কেন:</b> ${esc(m.why)}</p><ol class="steps">${m.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
    ${d ? `<div class="panel"><h3>তোমার লেখা</h3><p>${esc(S.missions[m.id].note)}</p></div>` : `<div class="field"><label for="ms-note">${esc(m.ask)}</label><textarea id="ms-note" rows="4" maxlength="400" placeholder="নিজের কথায় লেখো (কমপক্ষে ১০ অক্ষর)">${esc(V.note || '')}</textarea></div>
    <div class="row"><button class="btn go" data-act="ms-done">শেষ করেছি (+${bd(m.xp)})</button></div><p class="note">সৎভাবে করো। কেউ দেখছে না, তবু তোমার শেখা তোমারই লাভ। অভিভাবক এই লেখা দেখতে পারেন।</p>`}</div>`;
}

// ---------- আমার স্তর খুঁজি ----------
function runProbe(st) {
  startQuiz('probe', probeQuestions(st.at), { kind: 'probe', st });
}

// ---------- একাউন্ট ----------
function vAccount() {
  const f = V.form || {};
  if (loggedIn()) {
    return `<div class="screen">${backBtn('back', 'ফিরি')}<h1 class="ttl">আমার একাউন্ট</h1>
      <div class="panel"><h3>লগইন করা আছে: <span dir="ltr">${esc(S.account.user)}</span></h3>
        <p>শেষ সিঙ্ক: ${S.account.last ? new Date(S.account.last).toLocaleString('bn-BD') : 'এখনো হয়নি'}</p>
        <p class="note" style="text-align:left">অন্য ফোনে একই নাম আর পাসওয়ার্ড দিয়ে লগইন করলে এই লেভেল থেকেই শুরু হবে। অগ্রগতি নিজে নিজে সিঙ্ক হয়; ইন্টারনেট না থাকলে ফোনে জমা থাকে, এলে মেলানো হয়।</p>
        ${V.msg ? `<p class="note ${V.cls || ''}">${esc(V.msg)}</p>` : ''}
        <div class="row"><button class="btn" data-act="ac-sync" ${V.busy ? 'disabled' : ''}>${V.busy ? 'সিঙ্ক হচ্ছে…' : 'এখন সিঙ্ক করি'}</button><button class="btn alt" data-act="ac-logout">লগআউট</button></div></div>
      <div class="panel"><h3>একাউন্ট মুছে ফেলা</h3><p class="note" style="text-align:left">সার্ভার থেকে একাউন্ট ও অগ্রগতি স্থায়ীভাবে মুছে যাবে। এই ফোনের অগ্রগতি থাকবে।</p>
        <div class="field"><label for="ac-delp">পাসওয়ার্ড দিয়ে নিশ্চিত করো</label><input id="ac-delp" type="password" autocomplete="off" value="${esc(f.delp || '')}"></div>
        <div class="row"><button class="btn alt" data-act="ac-delete" ${V.busy ? 'disabled' : ''}>একাউন্ট মুছি</button></div></div></div>`;
  }
  const minor = ageBand() <= 2;
  return `<div class="screen">${backBtn('back', 'ফিরি')}<h1 class="ttl">লগইন বা নতুন একাউন্ট</h1>
    <p class="note" style="text-align:left">একাউন্ট থাকলে ফোন বদলালেও আগের লেভেল ফেরত পাবে। একাউন্ট ছাড়াও সব চলে। সার্ভারে শুধু নাম আর শেখার অগ্রগতি যায়; পিন, ফোনের সময়, API কী কখনো যায় না।</p>
    <div class="field"><label for="ac-user">ইউজারনেম (ইংরেজি ছোট হাতের অক্ষর, সংখ্যা, _ . -)</label><input id="ac-user" type="text" dir="ltr" autocapitalize="none" autocomplete="username" maxlength="32" value="${esc(f.user || '')}"></div>
    <div class="field"><label for="ac-pass">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label><input id="ac-pass" type="password" dir="ltr" autocomplete="current-password" maxlength="100" value="${esc(f.pass || '')}"></div>
    ${minor ? `<button class="tg wide" data-act="ac-consent" aria-pressed="${!!f.consent}">আমি অভিভাবক বা বড় কেউ, এই একাউন্ট খুলতে সম্মতি দিচ্ছি (নতুন একাউন্টের জন্য)</button>` : ''}
    <details class="adv" ${(!server() || f.showServer) ? 'open' : ''}><summary>সার্ভারের ঠিকানা</summary><div class="field"><input id="ac-server" type="url" dir="ltr" autocapitalize="none" placeholder="https://আপনার-সার্ভার.example" value="${esc(f.server !== undefined ? f.server : server())}"><p class="note" style="text-align:left">সার্ভার নিজে চালাতে হয় (README তে লেখা আছে)। নিরাপত্তার জন্য https ঠিকানা দাও।</p></div></details>
    ${V.msg ? `<p class="note ${V.cls || ''}">${esc(V.msg)}</p>` : ''}
    <div class="row"><button class="btn" data-act="ac-login" ${V.busy ? 'disabled' : ''}>লগইন</button><button class="btn alt" data-act="ac-register" ${V.busy ? 'disabled' : ''}>নতুন একাউন্ট</button></div></div>`;
}
async function accountDo(kind) {
  const f = V.form = V.form || {};
  const user = (f.user || '').trim(), pass = f.pass || '';
  if (f.server !== undefined) { S.account.server = f.server.trim(); save(true); }
  if (!user || !pass) { V.msg = 'ইউজারনেম আর পাসওয়ার্ড দুটিই লেখো।'; V.cls = 'bad'; render(); return; }
  if (kind === 'register' && ageBand() <= 2 && !f.consent) { V.msg = 'অভিভাবক বা বড় কারো সম্মতি লাগবে। সম্মতির বোতামটি চাপো।'; V.cls = 'bad'; render(); return; }
  V.busy = true; V.msg = ''; render();
  try {
    await (kind === 'register' ? register(user, pass) : login(user, pass));
    sfx.win(); toast(kind === 'register' ? 'একাউন্ট তৈরি হয়েছে' : 'লগইন হয়েছে, অগ্রগতি ফিরে এসেছে');
    V = { view: 'me' }; stack = []; render();
  } catch (e) { V.busy = false; V.msg = e instanceof AccountError ? e.message : 'কিছু একটা ভুল হয়েছে।'; V.cls = 'bad'; sfx.bad(); if (V.view === 'account') render(); }
}

// ---------- উপাধি ও ব্যাজ ----------
function rankCard() {
  const r = rank();
  return `<div class="panel rankc"><span class="belt" style="--bc:${r.col}"></span><div><b>${r.n}</b> <small>${r.c} বেল্ট</small><p>${r.next ? `আর ${bd(r.toNext)} লেভেল পেরোলে ${r.next.n} (${r.next.c})` : 'সর্বোচ্চ উপাধি!'}</p></div></div>`;
}
function badgeGrid() {
  const have = new Set(earned().map((b) => b.id));
  return `<div class="bgrid">${BADGES.map((b) => `<div class="bdg ${have.has(b.id) ? 'on' : ''}" title="${esc(b.d)}">${have.has(b.id) ? starIcon(true, 'st') : ui('lock')}<b>${esc(b.t)}</b><small>${esc(b.d)}</small></div>`).join('')}</div>`;
}
function questCard() {
  const q = todayQuests(), done = q.filter((x) => x.done).length;
  return `<div class="quests"><h3>আজকের তিন কাজ <small>${bd(done)}/৩</small></h3>${q.map((x) => `<div class="qs ${x.done ? 'on' : ''}">${x.done ? ui('check') : '<i></i>'}<span>${x.t}</span></div>`).join('')}${done === 3 ? '<p class="note">সব শেষ! আজ দারুণ করেছ।</p>' : ''}</div>`;
}

// ---------- সময়ের টিক ----------
let lastFree = 0, lastRest = 0;
function tick() {
  const f = freeLeft(), r = restLeft();
  document.querySelectorAll('.js-free').forEach((e) => { e.textContent = fmt(f); });
  document.querySelectorAll('.js-gt').forEach((e) => { e.textContent = V.t0 ? bd(Math.floor((Date.now() - V.t0) / 1000)) : '০'; });
  document.querySelectorAll('.js-rest').forEach((e) => { e.textContent = fmt(r); });
  const calm = ['home', 'practice', 'cards', 'me', 'rest', 'parent'].includes(V.view);
  if (lastFree > 0 && f === 0) {
    sfx.bad(); toast('ফোনের সময় শেষ! লেভেল পার করে আবার সময় জেতো'); syncNative();
    if (calm) render();
  }
  if (lastRest > 0 && r === 0) {
    toast('বিশ্রাম শেষ! আবার শেখা যাবে');
    if (calm) render();
  }
  lastFree = f; lastRest = r;
}

// ---------- আঁকা ----------
function render() {
  setTheme();
  const v = V.view;
  let h = '';
  if (v === 'welcome') h = vWelcome();
  else if (v === 'home') h = vHome() + tabbar();
  else if (v === 'practice') h = vPractice() + tabbar();
  else if (v === 'cards') h = vCards() + tabbar();
  else if (v === 'me') h = vMe() + tabbar();
  else if (v === 'node') h = vNode();
  else if (v === 'learn') h = vLearn();
  else if (v === 'write') h = vWrite();
  else if (v === 'play') h = vPlay();
  else if (v === 'coins') h = vCoins();
  else if (v === 'quiz') h = vQuiz();
  else if (v === 'result') h = vResult();
  else if (v === 'lesson') h = vLesson();
  else if (v === 'rest') h = vRest();
  else if (v === 'pin') h = vPin();
  else if (v === 'parent') h = vParent();
  else if (v === 'ask') h = vAsk();
  else if (v === 'grid') h = vGrid();
  else if (v === 'mistakes') h = vMistakes();
  else if (v === 'report') h = vReport();
  else if (v === 'missions') h = vMissions();
  else if (v === 'mission') h = vMission();
  else if (v === 'account') h = vAccount();
  app.innerHTML = h;
  app.className = 'view-' + v;
  window.scrollTo(0, 0);
  if (v === 'write') initWrite();
  const wt = app.querySelector('.wtab[aria-selected="true"]');
  if (wt && wt.parentElement) wt.parentElement.scrollLeft = Math.max(0, wt.offsetLeft - wt.parentElement.clientWidth / 2 + wt.offsetWidth / 2);
}

// ---------- ঘটনা ----------
app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  if (e.target.closest('.kcard') && b.classList.contains('modal')) return;
  const a = b.dataset.act, d = b.dataset;
  switch (a) {
    case 'pickmode': { const nm = document.getElementById('nm'); V.nm = nm ? nm.value : ''; V.pick = d.m; render(); break; }
    case 'pickage': { const nm = document.getElementById('nm'); V.nm = nm ? nm.value : ''; V.age = +d.v; if (!V.pick && V.age >= 3) V.pick = 'teen'; render(); break; }
    case 'start': {
      const nm = document.getElementById('nm');
      if (!V.age) { toast('আগে বয়স বাছো'); sfx.bad(); break; }
      S.age = V.age; S.world = V.age >= 3 ? 'mh' : 'bn';
      S.name = (nm ? nm.value : '').trim(); S.mode = V.pick || 'boy'; S.interests = (V.ints || []).slice(0, MAX_PICK); save(); sfx.win();
      stack = []; V = { view: 'pin', mode: 'set', buf: '', first: true }; render(); break;
    }
    case 'int': {
      const nm = document.getElementById('nm'); if (nm) V.nm = nm.value;
      const list = V.view === 'welcome' ? (V.ints = V.ints || []) : S.interests;
      const at = list.indexOf(d.id);
      if (at >= 0) list.splice(at, 1); else if (list.length < MAX_PICK) list.push(d.id); else toast(`সর্বোচ্চ ${bd(MAX_PICK)}টি বাছা যায়`);
      save(); render(); break;
    }
    case 'tab': sfx.tap(); setTab(d.v); break;
    case 'back': back(); break;
    case 'home': setTab('home'); break;
    case 'quit': stack = []; setTab('home'); break;
    case 'world': S.world = d.w; save(); if (!worldUnlocked(d.w)) toast('এখনো তালা দেওয়া। আরও পরীক্ষা পাস করো'); render(); break;
    case 'node':
      if (!nodeUnlocked(d.s, +d.i)) { toast('আগের ধাপের পরীক্ষা পাস করলে খুলবে'); sfx.bad(); break; }
      sfx.tap(); stack = [{ view: 'home' }]; V = { view: 'node', s: d.s, i: +d.i }; render(); break;
    case 'node-back': nodeScreen(V.s, V.i); break;
    case 'step': {
      if (!stepUnlocked(V.s, V.i, d.st)) { toast('আগের ধাপটি শেষ করো'); sfx.bad(); break; }
      if (gated()) break;
      const n = node(V.s, V.i);
      if (d.st === 'learn') startLearn();
      else if (d.st === 'write') startWrite();
      else if (d.st === 'play') startPlay();
      else startQuiz('node', questions(V.s, V.i, 5), { kind: 'node', s: V.s, i: V.i, lang: n.type });
      break;
    }
    case 'hear': { const n = node(V.s, V.i); speak(sayText(n.items[V.k], n), SUBJECTS[V.s].lang); break; }
    case 'mic': doMic(); break;
    case 'manual': V.got = true; V.msg = 'ভালো! এবার পরেরটায় যাই।'; V.cls = 'ok'; sfx.ok(); render(); break;
    case 'learn-next': learnNext(); break;
    case 'wclear': if (T) T.clear(); break;
    case 'wpeek': if (T) T.peek(); break;
    case 'wcheck': wcheck(); break;
    case 'wnext': wnext(); break;
    case 'pl': playTap('l', +d.j); break;
    case 'pr': playTap('r', +d.j); break;
    case 'play-done': playDone(); break;
    case 'coin': coinTap(+d.c); break;
    case 'coin-reset': V.sum = 0; V.tray = []; V.msg = ''; V.cls = ''; render(); break;
    case 'opt': pickOpt(+d.j); break;
    case 'qnext': qNext(); break;
    case 'qhear': { const q = V.qs[V.q]; speak(q.say, q.lang); break; }
    case 'retest': startQuiz('node', questions(V.res.meta.s, V.res.meta.i, 5), V.res.meta); break;
    case 'retopic': startTopicQuiz(V.res.meta.t); break;
    case 'practice': setTab('practice'); break;
    case 'grid-go': startGrid(d.k); break;
    case 'gk': gridKey(d.k); break;
    case 'mix-go': { if (gated()) break; const qs = mixedQuestions(10); if (qs.length < 2) { toast('আগে দুটি স্তর পাস করো'); break; } startQuiz('review', qs, { kind: 'review' }); break; }
    case 'review-go': { if (gated()) break; const qs = reviewQuestions(8); if (!qs.length) { toast('আজ কিছু বাকি নেই'); break; } startQuiz('review', qs, { kind: 'review' }); break; }
    case 'mk-open': go('mistakes'); break;
    case 'mk-go': { if (gated()) break; const qs = mistakeQuestions(5); if (!qs.length) { toast('খাতা খালি'); break; } startQuiz('mistake', qs, { kind: 'mistake' }); break; }
    case 'msn-list': go('missions'); break;
    case 'msn': { const m = missionsFor().find((x) => x.id === d.id); if (m) go('mission', { m, note: '' }); break; }
    case 'ms-done': {
      const t = (V.note || '').trim();
      if (t.length < 10) { toast('নিজের কথায় একটু লেখো (কমপক্ষে ১০ অক্ষর)'); sfx.bad(); break; }
      const xp = finishMission(V.m.id, t); sfx.win(); confetti();
      const bonus = questBonus(), badges = newBadges(); save();
      stack = []; V = { view: 'result', res: { pass: true, score: 0, n: 0, stars: 3, xp, lines: ['মিশন শেষ! হাতে-কলমে শেখাই আসল শেখা।'], bonus, badges, card: null, again: 'practice', meta: { kind: 'practice' }, title: 'মিশন সম্পন্ন!' } }; render(); break;
    }
    case 'probe-start': { if (gated()) break; runProbe(startProbe()); break; }
    case 'setage': S.age = +d.v; save(); render(); break;
    case 'ac-open': go('account', { form: {} }); break;
    case 'ac-login': accountDo('login'); break;
    case 'ac-register': accountDo('register'); break;
    case 'ac-consent': V.form.consent = !V.form.consent; render(); break;
    case 'ac-logout': logout(); toast('লগআউট হয়েছে'); V.msg = ''; render(); break;
    case 'ac-sync':
      V.busy = true; V.msg = ''; render();
      syncNow().then(() => { V.msg = 'সিঙ্ক হয়েছে।'; V.cls = 'ok'; }).catch((e) => { V.msg = e instanceof AccountError ? e.message : 'সিঙ্ক হয়নি।'; V.cls = 'bad'; })
        .finally(() => { V.busy = false; if (V.view === 'account') render(); });
      break;
    case 'ac-delete':
      V.busy = true; V.msg = ''; render();
      deleteAccount((V.form && V.form.delp) || '').then(() => { toast('একাউন্ট মুছে গেছে'); V.busy = false; V = { view: 'me' }; stack = []; render(); })
        .catch((e) => { V.busy = false; V.msg = e instanceof AccountError ? e.message : 'মোছা যায়নি।'; V.cls = 'bad'; render(); });
      break;
    case 'practice-go': if (gated()) break; startQuiz('practice', practiceQuestions(learnedNodes(), S.mastery, 5), { kind: 'practice' }); break;
    case 'topic': openTopic(d.id, d.w); break;
    case 'reco': {
      const r = recommend()[+d.k];
      if (!r) break;
      if (r.kind === 'node') { if (gated()) break; stack = [{ view: 'home' }]; V = { view: 'node', s: r.w, i: r.i }; render(); } else openTopic(r.id, r.w);
      break;
    }
    case 'plan': planGo(dailyPlan().items[+d.k]); break;
    case 'weak-go': planWeak(); break;
    case 'report-open': go('report'); break;
    case 'skip-test': if (gated()) break; startTopicQuiz(V.t); break;
    case 'lprev': V.c = Math.max(0, V.c - 1); render(); break;
    case 'lnext':
      if (V.c < V.t.cards.length - 1) { V.c++; sfx.tap(); render(); } else startTopicQuiz(V.t);
      break;
    case 'lhear': speak(V.t.cards[V.c], 'bn-BD'); break;
    case 'rest-view': go('rest', { why: 'rest' }); break;
    case 'parent-open': stack.push(V); V = { view: 'pin', mode: hasPin() ? 'enter' : 'set', buf: '' }; render(); break;
    case 'pk': pinKey(d.k); break;
    case 'pin-skip': stack = []; setTab('home'); break;
    case 'pin-change': V = { view: 'pin', mode: 'set', buf: '' }; stack.push({ view: 'parent' }); render(); break;
    case 'pset': S.parent[d.k] = +d.v; save(); syncNative(); render(); break;
    case 'p-grant': grantFree(10); toast('১০ মিনিট ফোন দেওয়া হয়েছে'); render(); break;
    case 'p-clear-rest': clearRest(); toast('বিশ্রাম বাদ দেওয়া হয়েছে'); render(); break;
    case 'plock':
      S.parent.lock = !S.parent.lock; save(); syncNative();
      if (S.parent.lock && native) toast('নিচের দুটি অনুমতি দিতে হবে'); render(); refreshStatus(); break;
    case 'p-usage': try { AppLock.requestUsageAccess(); } catch (e) { toast('এই ফোনে খোলা গেল না'); } break;
    case 'p-overlay': try { AppLock.requestOverlay(); } catch (e) { toast('এই ফোনে খোলা গেল না'); } break;
    case 'p-recheck': refreshStatus(); break;
    case 'ai-on': S.ai.on = !S.ai.on; save(); render(); break;
    case 'ai-prov': S.ai.provider = d.v; S.ai.model = d.v === 'openai' ? 'gpt-4o-mini' : 'claude-sonnet-5-5'; S.ai.base = ''; save(); render(); break;
    case 'ai-test':
      V.busy = true; V.aiMsg = ''; render();
      testConnection().then(() => { V.aiOk = true; V.aiMsg = 'যোগাযোগ ঠিক আছে।'; }).catch((e) => { V.aiOk = false; V.aiMsg = e instanceof AiError ? e.message : 'যোগাযোগ হয়নি।'; })
        .finally(() => { V.busy = false; if (V.view === 'parent') render(); });
      break;
    case 'ai-del': removeAiLesson(d.id); render(); break;
    case 'ai-gen':
      if (V.busy) break;
      V.busy = true; V.aiErr = ''; render();
      generateLesson().then((l) => { toast('নতুন পাঠ তৈরি: ' + l.t); sfx.ok(); }).catch((e) => { V.aiErr = e instanceof AiError ? e.message : 'পাঠ বানানো গেল না।'; })
        .finally(() => { V.busy = false; if (V.view === 'home') render(); });
      break;
    case 'ask-open': stack.push(V); V = { view: 'ask', q: '', ans: '', err: '' }; render(); break;
    case 'ask-go': {
      const q = document.getElementById('ask-q'); V.q = q ? q.value : '';
      V.busy = true; V.ans = ''; V.err = ''; render();
      askTutor(V.q).then((a) => { V.ans = a; speak(a, 'bn-BD'); }).catch((e) => { V.err = e instanceof AiError ? e.message : 'উত্তর পাওয়া গেল না।'; })
        .finally(() => { V.busy = false; if (V.view === 'ask') render(); });
      break;
    }
    case 'ask-hear': speak(V.ans, 'bn-BD'); break;
    case 'copen': sfx.flip(); V.open = d.id; render(); break;
    case 'cclose': V.open = null; render(); break;
    case 'chear': { const c = CARDS.find((x) => x.id === d.id); if (c) speak(c.fact, 'bn-BD'); break; }
    case 'setmode': S.mode = d.m; save(); render(); break;
    case 'sound': S.sound = !S.sound; save(); render(); break;
    case 'rate': S.rate = S.rate <= 0.7 ? 0.85 : 0.65; save(); render(); break;
    case 'reset':
      if (V.confirm) { resetAll().then(() => { stack = []; V = { view: 'welcome' }; render(); }); } else { V.confirm = true; render(); }
      break;
    default: break;
  }
});
const FIELDS = { nm2: (v) => { S.name = v.slice(0, 24); }, 'ms-note': (v) => { V.note = v; return false; }, 'ac-user': (v) => { (V.form = V.form || {}).user = v; return false; }, 'ac-pass': (v) => { (V.form = V.form || {}).pass = v; return false; }, 'ac-server': (v) => { (V.form = V.form || {}).server = v; return false; }, 'ac-delp': (v) => { (V.form = V.form || {}).delp = v; return false; }, 'ai-key': (v) => { S.ai.key = v.trim(); }, 'ai-model': (v) => { S.ai.model = v.trim(); }, 'ai-base': (v) => { S.ai.base = v.trim(); } };
app.addEventListener('input', (e) => { const f = FIELDS[e.target.id]; if (f && f(e.target.value) !== false) save(); });

// ---------- চালু ----------
(async function boot() {
  app.insertAdjacentHTML('beforebegin', '<div id="scene" class="scene-bg" aria-hidden="true"></div>');
  document.body.insertAdjacentHTML('beforeend', '<div id="toast" role="status" aria-live="polite"></div>');
  await loadState();
  startAutoSync();
  if (loggedIn()) syncNow().then(() => { if (['home', 'me', 'practice'].includes(V.view)) render(); }).catch(() => {});
  V = S.mode ? { view: 'home' } : { view: 'welcome' };
  render();
  syncNative();
  setInterval(tick, 1000);
  try { CapApp.addListener('backButton', () => back()); } catch (e) { /* ব্রাউজারে নেই */ }
})();
