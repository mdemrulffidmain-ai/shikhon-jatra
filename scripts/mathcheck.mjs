import { MATH_GEN, MATH_LEVELS } from '../src/data/mathpath.js';
const en = (s) => s.replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));
const num = (s) => +en(s).replace(/,/g, '').replace('−', '-');
let bad = 0; const f = (m) => { bad++; if (bad < 30) console.log('✗', m); };
for (const [k, g] of Object.entries(MATH_GEN)) for (let i = 0; i < 400; i++) {
  const q = g();
  if (!q.p || !q.why || q.o.length < 3 || new Set(q.o).size !== q.o.length || q.a < 0 || q.a >= q.o.length) { f(`${k}: ${q.p} ${q.o}`); continue; }
  if (/NaN|undefined|Infinity/.test(q.o.join('') + q.p) ) f(`${k}: bad text ${q.p} ${q.o}`);
  const ans = q.o[q.a], P = en(q.p);
  let m;
  if ((m = P.match(/^(\d+) \+ (\d+) = \?$/))) if (en(ans) != +m[1] + +m[2]) f(`add ${q.p} ${ans}`);
  if ((m = P.match(/^(\d+) − (\d+) = \?$/))) if (num(ans) != +m[1] - +m[2]) f(`sub ${q.p} ${ans}`);
  if ((m = P.match(/^(\d+) × (\d+) = \?$/))) if (en(ans) != +m[1] * +m[2]) f(`mul ${q.p} ${ans}`);
  if ((m = P.match(/^(\d+) ÷ (\d+) = \?$/))) if (en(ans) != +m[1] / +m[2]) f(`div ${q.p} ${ans}`);
  if ((m = P.match(/^(\d+)x = (\d+) হলে/))) if (en(ans) != +m[2] / +m[1]) f(`eq ${q.p} ${ans}`);
  if ((m = P.match(/^x \+ (\d+) = (\d+) হলে/))) if (en(ans) != +m[2] - +m[1]) f(`eq ${q.p} ${ans}`);
  if ((m = P.match(/^(\d+)x \+ (\d+) = (\d+) হলে/))) if (en(ans) != (+m[3] - +m[2]) / +m[1]) f(`eq2 ${q.p} ${ans}`);
  if ((m = P.match(/^(\d+)x − (\d+) = (\d+) হলে/))) if (en(ans) != (+m[3] + +m[2]) / +m[1]) f(`eq2 ${q.p} ${ans}`);
  if ((m = P.match(/^√(\d+) = \?$/))) if (en(ans) != Math.sqrt(+m[1])) f(`sqrt ${q.p} ${ans}`);
  if ((m = P.match(/^(\d+)\^(\d+) =/))) if (en(ans).replace(/,/g, '') != Math.pow(+m[1], +m[2])) f(`pow ${q.p} ${ans}`);
}
console.log(Object.keys(MATH_GEN).length, 'জেনারেটর', MATH_LEVELS.length, 'স্তর', bad ? bad + ' সমস্যা' : 'ঠিক ✓');
process.exit(bad ? 1 : 0);
