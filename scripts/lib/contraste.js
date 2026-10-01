/**
 * SYX — contraste WCAG sobre valores OKLCH
 * ─────────────────────────────────────────
 * Convierte oklch() a sRGB y calcula la razón de contraste de WCAG 2.x. Sin
 * dependencias: la usan check-contraste.js y cualquier herramienta que
 * necesite la misma cuenta.
 *
 * Entiende también la sintaxis relativa, que es como el sistema DERIVA sus
 * colores sin cambiar la marca: `oklch(from oklch(…) L c h)` para las tintas
 * y `oklch(from oklch(…) clamp(calc(…), l, calc(…)) c h)` para la variante
 * fuerte de los controles. Cada canal puede ser un número, una de las
 * palabras `l`, `c`, `h` (el canal del color de origen) o calc(), min(),
 * max() y clamp() de ellas, que es todo lo que el SCSS usa. Si mañana alguien
 * escribe algo que esto no sabe evaluar, el color sale null y check-contraste
 * lo informa como «sin medir»: nunca se aprueba un par que no se ha medido.
 */
'use strict';

function oklchARgb(L, C, hGrados) {
  const h = (hGrados * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((x) => Math.min(1, Math.max(0, x))); // lineal, recortado a la gama sRGB
}

/**
 * Evalúa la expresión de un canal de la sintaxis relativa. `canales` trae los
 * del color de origen ({ l, c, h }). Devuelve un número o null.
 */
function evaluarCanal(expr, canales) {
  const tokens = expr.match(/\d*\.\d+|\d+|[a-z]+\(|[a-z]+|[-+*/(),%]/gi);
  if (!tokens || tokens.join('').replace(/\s/g, '') !== expr.replace(/\s/g, '')) return null;
  let i = 0;
  const ver = () => tokens[i], tomar = () => tokens[i++];
  function primario() {
    const t = tomar();
    if (t === undefined) throw new Error('fin');
    if (/^[\d.]+$/.test(t)) { if (ver() === '%') { tomar(); return +t / 100; } return +t; }
    if (t === '-') return -primario();
    if (t === '(') { const v = suma(); if (tomar() !== ')') throw new Error(')'); return v; }
    if (/^(calc|min|max|clamp)\($/i.test(t)) {
      const args = [suma()];
      while (ver() === ',') { tomar(); args.push(suma()); }
      if (tomar() !== ')') throw new Error(')');
      const f = t.slice(0, -1).toLowerCase();
      if (f === 'calc' && args.length === 1) return args[0];
      if (f === 'min') return Math.min(...args);
      if (f === 'max') return Math.max(...args);
      if (f === 'clamp' && args.length === 3) return Math.max(args[0], Math.min(args[1], args[2]));
      throw new Error(f);
    }
    if (t in canales) return canales[t];
    throw new Error(t);
  }
  function producto() {
    let v = primario();
    while (ver() === '*' || ver() === '/') v = tomar() === '*' ? v * primario() : v / primario();
    return v;
  }
  function suma() {
    let v = producto();
    while (ver() === '+' || ver() === '-') v = tomar() === '+' ? v + producto() : v - producto();
    return v;
  }
  try {
    const v = suma();
    return i === tokens.length && Number.isFinite(v) ? v : null;
  } catch { return null; }
}

/** Parte una lista de argumentos por espacios de primer nivel (respeta paréntesis). */
function argumentos(cuerpo) {
  const out = [];
  let prof = 0, actual = '';
  for (const ch of cuerpo.trim()) {
    if (ch === '(') prof++;
    if (ch === ')') prof--;
    if (/\s/.test(ch) && prof === 0) { if (actual) out.push(actual); actual = ''; } else actual += ch;
  }
  if (actual) out.push(actual);
  return out;
}

/** { L, C, H, alfa } de un oklch() literal o relativo, o null. */
function leerOklch(valor) {
  const v = valor.trim().replace(/\s+/g, ' ');
  const m = /^oklch\((.*)\)$/.exec(v);
  if (!m) return null;
  let cuerpo = m[1].trim(), alfa = 1;
  const barra = cuerpo.lastIndexOf('/');
  if (barra !== -1 && !cuerpo.slice(barra).includes(')')) {
    const a = cuerpo.slice(barra + 1).trim();
    alfa = a.endsWith('%') ? +a.slice(0, -1) / 100 : +a;
    cuerpo = cuerpo.slice(0, barra);
  }
  const partes = argumentos(cuerpo);
  if (partes[0] === 'from') {
    // from <color de origen> <L> <C> <H>
    if (partes.length !== 5) return null;
    const origen = leerOklch(partes[1]) || (/^(white|black)$/.test(partes[1]) ? { L: partes[1] === 'white' ? 1 : 0, C: 0, H: 0 } : null);
    if (!origen) return null;
    const canales = { l: origen.L, c: origen.C, h: origen.H };
    const [L, C, H] = partes.slice(2).map((x) => evaluarCanal(x, canales));
    if ([L, C, H].some((x) => x === null)) return null;
    return { L, C, H, alfa };
  }
  if (partes.length !== 3) return null;
  const L = /%$/.test(partes[0]) ? +partes[0].slice(0, -1) / 100 : +partes[0];
  const C = +partes[1], H = +partes[2].replace(/deg$/, '');
  if ([L, C, H].some((x) => !Number.isFinite(x))) return null;
  return { L, C, H, alfa: Number.isFinite(alfa) ? alfa : 1 };
}

/** Color lineal [r,g,b] y alfa, o null si el valor no es un color que sepamos leer. */
function leerColor(valor) {
  if (!valor) return null;
  const v = valor.trim();
  const ok = leerOklch(v);
  if (ok) return { rgb: oklchARgb(ok.L, ok.C, ok.H), alfa: ok.alfa };
  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const n = parseInt(hex[1], 16);
    const lin = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    return { rgb: [lin(n >> 16), lin((n >> 8) & 255), lin(n & 255)], alfa: 1 };
  }
  if (v === 'white') return { rgb: [1, 1, 1], alfa: 1 };
  if (v === 'black') return { rgb: [0, 0, 0], alfa: 1 };
  return null;
}

const luminancia = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

/** Razón de contraste de WCAG 2.x, o null si alguno de los dos no se puede leer. */
function contraste(primerPlano, fondo) {
  const f = leerColor(primerPlano), b = leerColor(fondo);
  if (!f || !b) return null;
  const rgb = f.alfa < 1 ? f.rgb.map((x, i) => x * f.alfa + b.rgb[i] * (1 - f.alfa)) : f.rgb;
  const y1 = luminancia(rgb), y2 = luminancia(b.rgb);
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
}

module.exports = { leerColor, leerOklch, contraste };
