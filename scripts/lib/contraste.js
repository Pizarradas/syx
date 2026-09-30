/**
 * SYX — contraste WCAG sobre valores OKLCH
 * ─────────────────────────────────────────
 * Convierte oklch() (también la sintaxis relativa `oklch(from oklch(…) L c h)`,
 * que es como el sistema deriva sus tintas) a sRGB y calcula la razón de
 * contraste de WCAG 2.x. Sin dependencias: la usan check-contraste.js y
 * cualquier herramienta que necesite la misma cuenta.
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

/** Color lineal [r,g,b] y alfa, o null si el valor no es un color que sepamos leer. */
function leerColor(valor) {
  if (!valor) return null;
  let v = valor.trim();
  const rel = /^oklch\(\s*from\s+oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)\s+([\d.]+)\s+c\s+h\s*\)$/.exec(v);
  if (rel) v = `oklch(${rel[5]} ${rel[3]} ${rel[4]})`;
  const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/.exec(v);
  if (m) {
    const L = m[2] ? +m[1] / 100 : +m[1];
    const alfa = m[5] === undefined ? 1 : m[6] ? +m[5] / 100 : +m[5];
    return { rgb: oklchARgb(L, +m[3], +m[4]), alfa };
  }
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

module.exports = { leerColor, contraste };
