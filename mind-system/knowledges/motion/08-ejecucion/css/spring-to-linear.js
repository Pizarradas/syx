// spring-to-linear.js — genera `linear()` de CSS a partir de un spring o de cualquier easing.
// Uso (Node): node spring-to-linear.js 400 0.1        → spring {duration: 400ms, bounce: 0.1}
//             node spring-to-linear.js easeOutBounce  → función de easing con nombre
// Devuelve: la duración recomendada (tiempo de asentamiento) y la cadena linear().

function springFromPerceptual(durationMs, bounce) {
  const d = durationMs / 1000;
  const k = Math.pow((2 * Math.PI) / d, 2);
  const z = bounce >= 0 ? 1 - bounce : 1 / (1 + bounce);
  const c = (4 * Math.PI * z) / d;
  return { k, c, m: 1 };
}

function springX(t, { k, c, m }) {
  const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
  if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
  if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const r1 = -w0 * (z - Math.sqrt(z * z - 1)), r2 = -w0 * (z + Math.sqrt(z * z - 1));
  const C1 = r2 / (r1 - r2), C2 = -1 - C1;
  return 1 + C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
}

function settleTime(fn, tol = 0.005, maxT = 5, dt = 0.001) {
  let last = 0;
  for (let t = 0; t < maxT; t += dt) if (Math.abs(fn(t) - 1) > tol) last = t;
  return last + dt;
}

// Simplificación Ramer–Douglas–Peucker: conserva solo los puntos necesarios (tolerancia en unidades de progreso)
function toLinear(fn01, samples = 60, tol = 0.002) {
  const pts = [];
  for (let i = 0; i <= samples; i++) { const x = i / samples; pts.push([x, fn01(x)]); }
  pts[pts.length - 1][1] = 1;                      // el final siempre llega a 1
  const rdp = (a, b) => {
    let maxD = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [x0, y0] = pts[a], [x1, y1] = pts[b], [x, y] = pts[i];
      const d = Math.abs(y - (y0 + (y1 - y0) * (x - x0) / (x1 - x0)));
      if (d > maxD) { maxD = d; idx = i; }
    }
    return maxD > tol ? [...rdp(a, idx), ...rdp(idx, b).slice(1)] : [a, b];
  };
  const keep = rdp(0, pts.length - 1).map(i => pts[i]);
  const r = n => +n.toFixed(4);
  return 'linear(' + keep.map(([x, y], i) =>
    (i === 0 || i === keep.length - 1) ? `${r(y)}` : `${r(y)} ${r(x * 100)}%`).join(', ') + ')';
}

const easings = {
  easeOutBounce: t => { const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
  easeOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
};

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('spring-to-linear.js')) {
  const [a, b] = process.argv.slice(2);
  if (easings[a]) { console.log(toLinear(easings[a], 160, 0.003)); }
  else {
    const s = springFromPerceptual(+a || 400, +b || 0);
    const T = settleTime(t => springX(t, s));
    console.log(`/* spring duration=${a}ms bounce=${b} → settle ${Math.round(T * 1000)}ms */`);
    console.log(`transition-duration: ${Math.round(T * 1000)}ms;`);
    console.log(`transition-timing-function: ${toLinear(x => springX(x * T, s))};`);
  }
}

if (typeof module !== 'undefined') module.exports = { springFromPerceptual, springX, settleTime, toLinear, easings };
