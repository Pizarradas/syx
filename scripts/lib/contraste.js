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
 *
 * Y entiende color-mix() —en srgb, srgb-linear, oklab y oklch, con alfa
 * premultiplicado como lo hace el navegador— y `transparent`, porque los
 * tonos suaves de la capa semántica (acción 14 de la auditoría de 2026-10)
 * son el color del tono al 12 % sobre transparente: un fondo translúcido que
 * se posa sobre la superficie de debajo. Para medir un texto sobre él hay que
 * componerlo antes sobre esa superficie (el tercer argumento de contraste()).
 */
'use strict';

/**
 * oklch → sRGB lineal SIN recortar. Un canal fuera de [0, 1] dice que el color
 * cae fuera de la gama sRGB; resolveColor() (consulta.js) lo usa para avisar.
 */
function oklchALineal(L, C, hGrados) {
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
  ];
}

function oklchARgb(L, C, hGrados) {
  // lineal, recortado canal a canal a la gama sRGB (no es el mapeo de gama de
  // CSS Color 4, que reduce croma: para un color fuera de gama puede diferir)
  return oklchALineal(L, C, hGrados).map((x) => Math.min(1, Math.max(0, x)));
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

// ─── Espacios de color ──────────────────────────────────────────────────────

const aLineal = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
const aGamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

function rgbAOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}
function oklabARgb([L, a, b]) {
  const C = Math.hypot(a, b);
  const H = (Math.atan2(b, a) * 180) / Math.PI;
  return oklchARgb(L, C, H);
}

/**
 * color-mix(in <espacio>, <color> [p%], <color> [p%]) → { rgb lineal, alfa }.
 * Porcentajes como la especificación: si falta uno es el resto hasta 100; si
 * suman menos de 100, la diferencia se va al alfa. Alfa premultiplicado.
 */
function leerColorMix(v) {
  const m = /^color-mix\(\s*in\s+([a-z-]+)(?:\s+(?:shorter|longer|increasing|decreasing)\s+hue)?\s*,(.*)\)$/i.exec(v);
  if (!m) return null;
  const espacio = m[1].toLowerCase();
  // Los dos operandos, separados por la coma de primer nivel.
  const resto = m[2];
  let prof = 0, corte = -1;
  for (let i = 0; i < resto.length; i++) {
    if (resto[i] === '(') prof++;
    else if (resto[i] === ')') prof--;
    else if (resto[i] === ',' && prof === 0) { corte = i; break; }
  }
  if (corte === -1) return null;
  const operando = (t) => {
    const x = /^(.*?)(?:\s+(\d*\.?\d+)%)?$/.exec(t.trim());
    return { color: leerColor(x[1].trim()), p: x[2] !== undefined ? +x[2] / 100 : null };
  };
  const a = operando(resto.slice(0, corte)), b = operando(resto.slice(corte + 1));
  if (!a.color || !b.color) return null;
  let p1 = a.p, p2 = b.p;
  if (p1 === null && p2 === null) { p1 = 0.5; p2 = 0.5; }
  else if (p1 === null) p1 = 1 - p2;
  else if (p2 === null) p2 = 1 - p1;
  const suma = p1 + p2;
  if (suma <= 0) return null;
  const multAlfa = Math.min(1, suma);
  p1 /= suma; p2 /= suma;

  const alfa = a.color.alfa * p1 + b.color.alfa * p2;
  if (alfa === 0) return { rgb: [0, 0, 0], alfa: 0 };
  // Canales en el espacio pedido, premultiplicados por su alfa (salvo el tono).
  const canales = (c) => {
    if (espacio === 'srgb') return c.rgb.map(aGamma);
    if (espacio === 'srgb-linear') return c.rgb.slice();
    if (espacio === 'oklab' || espacio === 'oklch') return rgbAOklab(c.rgb);
    return null;
  };
  const ca = canales(a.color), cb = canales(b.color);
  if (!ca || !cb) return null;
  let mezcla;
  if (espacio === 'oklch') {
    const polar = ([L, x, y]) => [L, Math.hypot(x, y), (Math.atan2(y, x) * 180) / Math.PI];
    const [La, Ca, Ha] = polar(ca), [Lb, Cb, Hb] = polar(cb);
    // Tono «impotente» (croma ~0, o alfa 0): se toma el del otro color.
    const sinTonoA = Ca < 1e-4 || a.color.alfa === 0, sinTonoB = Cb < 1e-4 || b.color.alfa === 0;
    let h1 = sinTonoA ? Hb : Ha, h2 = sinTonoB ? Ha : Hb;
    let d = h2 - h1;
    if (d > 180) h1 += 360; else if (d < -180) h2 += 360; // shorter hue
    const pm = (x, y) => (x * a.color.alfa * p1 + y * b.color.alfa * p2) / alfa;
    const H = h1 * p1 + h2 * p2;
    mezcla = { rgb: oklchARgb(pm(La, Lb), pm(Ca, Cb), H), alfa };
  } else {
    const v3 = [0, 1, 2].map((i) => (ca[i] * a.color.alfa * p1 + cb[i] * b.color.alfa * p2) / alfa);
    const rgb = espacio === 'srgb' ? v3.map(aLineal) : espacio === 'srgb-linear' ? v3 : oklabARgb(v3);
    mezcla = { rgb: rgb.map((x) => Math.min(1, Math.max(0, x))), alfa };
  }
  mezcla.alfa *= multAlfa;
  return mezcla;
}

/** Color lineal [r,g,b] y alfa, o null si el valor no es un color que sepamos leer. */
function leerColor(valor) {
  if (!valor) return null;
  const v = valor.trim();
  if (/^transparent$/i.test(v)) return { rgb: [0, 0, 0], alfa: 0 };
  if (/^color-mix\(/i.test(v)) return leerColorMix(v);
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

/** `arriba` (con su alfa) sobre `abajo`, compuesto en sRGB codificado como el navegador. */
function componer(arriba, abajo) {
  if (arriba.alfa >= 1) return { rgb: arriba.rgb, alfa: 1 };
  const g = (i) => aGamma(arriba.rgb[i]) * arriba.alfa + aGamma(abajo.rgb[i]) * (1 - arriba.alfa);
  return { rgb: [0, 1, 2].map((i) => aLineal(g(i))), alfa: 1 };
}

/**
 * Razón de contraste de WCAG 2.x, o null si alguno no se puede leer. Si el
 * fondo es translúcido hace falta saber sobre qué se posa (`base`); sin base,
 * un fondo translúcido no se mide (null): medirlo como opaco aprobaría pares
 * que el navegador no pinta así.
 */
function contraste(primerPlano, fondo, base) {
  const f = leerColor(primerPlano);
  let b = leerColor(fondo);
  if (!f || !b) return null;
  if (b.alfa < 1) {
    const sb = base ? leerColor(base) : null;
    if (!sb || sb.alfa < 1) return null;
    b = componer(b, sb);
  }
  const rgb = componer(f, b).rgb;
  const y1 = luminancia(rgb), y2 = luminancia(b.rgb);
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
}

module.exports = { leerColor, leerOklch, contraste, oklchALineal, rgbAOklab, aGamma };
