import { SCI_GEN, SCI_LEVELS } from '../src/data/science2.js';
let bad = 0; const f = (m) => { bad++; if (bad < 30) console.log('✗', m); };
for (const [k, g] of Object.entries(SCI_GEN)) for (let i = 0; i < 300; i++) {
  const q = g();
  if (!q.p || !q.why || q.o.length < 3 || new Set(q.o).size !== q.o.length || q.a < 0 || q.a >= q.o.length) f(`${k}: ${q.p} ${q.o}`);
  else if (/NaN|undefined|Infinity|๑/.test(q.o.join('') + q.p + q.why)) f(`${k}: bad text ${q.p} ${q.o}`);
}
for (const l of SCI_LEVELS) {
  if (l.cards.length < 3 || l.qs.length < 5) f('level thin ' + l.t);
  for (const q of l.qs) if (typeof q === 'string' && !SCI_GEN[q]) f('missing gen ' + q);
  for (const q of l.qs) if (typeof q === 'object') { if (new Set(q.o).size !== q.o.length || !q.o[q.a]) f('static ' + q.p); }
}
console.log(Object.keys(SCI_GEN).length, 'জেনারেটর', SCI_LEVELS.length, 'স্তর', bad ? bad + ' সমস্যা' : 'ঠিক ✓');
process.exit(bad ? 1 : 0);
