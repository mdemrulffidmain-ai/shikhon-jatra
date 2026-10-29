import { HIGH_GEN, HIGH_LEVELS } from '../src/data/mathhigh.js';
const en = (s) => String(s).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c)).replace(/,/g, '').replace('−', '-');
let bad = 0; const f = (m) => { bad++; if (bad < 30) console.log('✗', m); };
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
for (const [k, g] of Object.entries(HIGH_GEN)) for (let i = 0; i < 500; i++) {
  const q = g();
  if (!q.p || !q.why || q.o.length !== 4 || new Set(q.o).size !== 4 || q.a < 0 || q.a > 3) { f(`${k}: ${q.p} ${q.o}`); continue; }
  if (/NaN|undefined|Infinity/.test(q.o.join('') + q.p + q.why)) f(`${k}: bad text`);
  const ans = en(q.o[q.a]), P = en(q.p); let m;
  if (k === 'h_log' && (m = P.match(/log(.) (\d+)/))) { /* subscript digit */ }
  if (k === 'h_det' && (m = en(q.show).match(/\[ (\d+)\s+(\d+) \]\s*\[ (\d+)\s+(\d+) \]/))) if (+ans !== m[1] * m[4] - m[2] * m[3]) f(`det ${q.show} ${ans}`);
  if (k === 'h_fact' && (m = P.match(/^(\d+)!/))) if (+ans !== fact(+m[1])) f(`fact ${q.p} ${ans}`);
  if (k === 'h_exp' && (m = P.match(/^(\d+)\^x = (\d+)/))) if (Math.pow(+m[1], +ans) !== +m[2]) f(`exp ${q.p} ${ans}`);
  if (k === 'h_apterm' && (m = P.match(/ধারা: (\d+), (\d+), (\d+).*?(\d+) তম/))) { const a = +m[1], d = +m[2] - +m[1]; if (+ans !== a + (+m[4] - 1) * d) f(`ap ${q.p} ${ans}`); }
  if (k === 'h_apsum' && (m = P.match(/ধারা: (\d+), (\d+), (\d+).*?প্রথম (\d+)টি/))) { const a = +m[1], d = +m[2] - +m[1], n = +m[4]; let s = 0; for (let j = 0; j < n; j++) s += a + j * d; if (+ans !== s) f(`apsum ${q.p} ${ans}`); }
  if (k === 'h_gpterm' && (m = P.match(/ধারা: (\d+), (\d+),.*?(\d+) তম/))) { if (+ans !== +m[1] * Math.pow(m[2] / m[1], +m[3] - 1)) f(`gp ${q.p} ${ans}`); }
  if (k === 'h_gpsum' && (m = P.match(/ধারা: (\d+), (\d+),.*?প্রথম (\d+)টি/))) { let s = 0; for (let j = 0; j < +m[3]; j++) s += m[1] * Math.pow(2, j); if (+ans !== s) f(`gpsum ${q.p} ${ans}`); }
  if (k === 'h_team' && (m = P.match(/^(\d+) জনের.*?(\d+) জনের/))) { const n = +m[1], r = +m[2]; if (+ans !== fact(n) / (fact(r) * fact(n - r))) f(`team ${q.p} ${ans}`); }
  if (k === 'h_int1' && (m = P.match(/\(০ থেকে (\d+)\)/))) if (+ans !== m[1] * m[1]) f(`int1 ${q.p} ${ans}`);
  if (k === 'h_int3' && (m = P.match(/\(০ থেকে (\d+)\)/))) if (+ans !== m[1] ** 3) f(`int3 ${q.p} ${ans}`);
  if (k === 'h_mmul' && (m = en(q.show).replace(/<[^>]+>/g, ' ').match(/\[ (\d+)\s+(\d+) \]\s*\[ (\d+)\s+(\d+) \]\s*\[ (\d+)\s+(\d+) \]\s*\[ (\d+)\s+(\d+) \]/))) { if (+ans !== m[1] * m[5] + m[2] * m[7]) f(`mmul ${q.show} ${ans}`); }
}
if(1){const q=HIGH_GEN.h_mmul();const m=en(q.show).replace(/<[^>]+>/g,' ').match(/\[ (\d+)\s+(\d+) \]\s*\[ (\d+)\s+(\d+) \]\s*\[ (\d+)\s+(\d+) \]\s*\[ (\d+)\s+(\d+) \]/);if(!m){console.log('✗ mmul regex');process.exit(1)}}
console.log(Object.keys(HIGH_GEN).length, 'জেনারেটর', HIGH_LEVELS.length, 'স্তর', bad ? bad + ' সমস্যা' : 'ঠিক ✓');
process.exit(bad ? 1 : 0);
