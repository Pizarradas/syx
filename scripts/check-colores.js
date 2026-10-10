#!/usr/bin/env node
/**
 * SYX — Colores para canvas: la conversión es una sola
 * ────────────────────────────────────────────────────
 * Comprueba los dos ayudantes que pasan un color de SYX a hex o rgb para las
 * librerías que pintan en canvas (ECharts, Chart.js, D3) y no leen `oklch()`:
 *
 *   · resolveColor() de la API de Node (scripts/lib/consulta.js)
 *   · js/syx-colors.js, el del navegador, que no puede requerir lib/
 *
 * POR QUÉ HACE FALTA
 * Ya había dos conversores oklch → sRGB en scripts/lib (contraste.js y
 * figma.js), y el del navegador es por fuerza un tercero. Tres copias de unas
 * matrices divergen en silencio, y un gráfico pintado con un azul que no es el
 * del sistema no lo detecta nadie. Así que aquí:
 *
 *   1. Valores conocidos, independientes de SYX (rojo, azul y verde sRGB en
 *      oklch, blanco, negro).
 *   2. resolveColor() contra figma.aColor + aHex en cada token oklch() de los
 *      siete temas y los dos modos.
 *   3. js/syx-colors.js contra resolveColor() en esos mismos tokens, y en las
 *      serializaciones que devuelve un navegador (oklch, oklab, color(srgb …),
 *      rgb, rgba), con un DOM simulado.
 *
 * Uso: node scripts/check-colores.js   ·   npm run check:colores
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const syx = require(path.join(ROOT, 'index.js'));
const figma = require('./lib/figma');

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });
const lanza = (fn, patron) => {
  try { fn(); } catch (e) {
    if (patron && !patron.test(e.message)) throw new Error(`lanza, pero con otro motivo: ${e.message}`);
    return;
  }
  throw new Error('deberia lanzar');
};
// Un canal de 8 bits puede caer a un lado u otro del redondeo según el orden de
// las operaciones de cada conversor; más de 1 ya es otro color.
const casiIgual = (h1, h2) => {
  if (!/^#[0-9a-f]{6}$/.test(h1) || !/^#[0-9a-f]{6}$/.test(h2)) return h1 === h2;
  return [1, 3, 5].every((i) => Math.abs(parseInt(h1.slice(i, i + 2), 16) - parseInt(h2.slice(i, i + 2), 16)) <= 1);
};

const { themes, modes } = syx.listThemes();
const contextos = themes.flatMap((theme) => modes.map((mode) => ({ theme, mode })));

// ─── 1 · API de Node ─────────────────────────────────────────────────────────

comprobar('resolveColor da los valores conocidos de sRGB', () => {
  const esperados = {
    'oklch(0.6279 0.2577 29.23)': '#ff0000',
    'oklch(0.4520 0.3132 264.05)': '#0000ff',
    'oklch(0.5198 0.1769 142.5)': '#008000',
    'oklch(1 0 0)': '#ffffff',
    'oklch(0 0 0)': '#000000',
  };
  for (const [v, hex] of Object.entries(esperados)) {
    const r = syx.resolveColor(v);
    if (r !== hex) throw new Error(`${v} → ${r}, esperaba ${hex}`);
  }
});

comprobar('resolveColor coincide con el conversor de Figma en cada token oklch() de cada tema y modo', () => {
  let n = 0;
  const malos = [];
  for (const { theme, mode } of contextos) {
    for (const [token, valor] of Object.entries(syx.listTokens({ theme, mode }).tokens)) {
      if (typeof valor !== 'string' || !/^oklch\(\s*[\d.]/.test(valor)) continue;
      const c = figma.aColor(valor);
      if (!c || c.a < 1) continue;
      n++;
      const a = syx.resolveColor(token, { theme, mode });
      const b = figma.aHex(c);
      if (!casiIgual(a, b)) malos.push(`${theme}/${mode} ${token}: ${a} ≠ ${b}`);
    }
  }
  if (n < 500) throw new Error(`solo ${n} tokens comparados: el recorrido no está leyendo los temas`);
  if (malos.length) throw new Error(`${malos.length} discrepancias: ${malos.slice(0, 3).join(' · ')}`);
});

comprobar('resolveColor sigue el tema y el modo', () => {
  const t = '--semantic-color-primary';
  const a = syx.resolveColor(t, { mode: 'light' });
  const b = syx.resolveColor(t, { mode: 'dark' });
  const c = syx.resolveColor(t, { theme: 'example-03' });
  if (a === b) throw new Error('claro y oscuro dan el mismo color');
  if (a === c) throw new Error('syx-sketch y example-03 dan el mismo color');
});

comprobar('resolveColor reduce color-mix() y var(), y acepta la forma objeto', () => {
  const d = syx.resolveColor({ token: 'var(--semantic-color-category-1-bg)', theme: 'example-03', mode: 'dark', detailed: true });
  if (!/^color-mix\(/.test(d.value)) throw new Error(`el caso ya no es un color-mix: ${d.value} — elegir otro token`);
  if (!/^#[0-9a-f]{6}$/.test(d.hex)) throw new Error(`hex mal formado: ${d.hex}`);
  if (d.clipped !== null) throw new Error('el recorte de una mezcla no se sigue: clipped debería ser null');
});

comprobar('los tres formatos describen el mismo color', () => {
  for (const { theme, mode } of contextos) {
    const t = '--semantic-color-primary';
    const hex = syx.resolveColor(t, { theme, mode });
    const rgb = syx.resolveColor(t, { theme, mode, format: 'rgb' });
    const ok = syx.resolveColor(t, { theme, mode, format: 'oklch' });
    const m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(rgb);
    if (!m) throw new Error(`rgb mal formado: ${rgb}`);
    const deRgb = '#' + m.slice(1).map((x) => (+x).toString(16).padStart(2, '0')).join('');
    if (deRgb !== hex) throw new Error(`${theme}/${mode}: rgb ${rgb} ≠ hex ${hex}`);
    if (!casiIgual(syx.resolveColor(ok), hex)) throw new Error(`${theme}/${mode}: ${ok} no vuelve a ${hex}`);
  }
});

comprobar('resolveColor recorta lo que cae fuera de sRGB, y lo dice', () => {
  const d = syx.resolveColor('oklch(0.9 0.4 150)', { detailed: true });
  if (d.clipped !== true) throw new Error('un verde de croma 0.4 cae fuera de sRGB y no se marca');
  if (d.rgb.some((x) => x < 0 || x > 255)) throw new Error(`canales fuera de rango: ${d.rgb}`);
  if (syx.resolveColor('--semantic-color-primary', { detailed: true }).clipped !== false) throw new Error('un color en gama sale recortado');
});

comprobar('resolveColor lanza con motivo en vez de inventarse un color', () => {
  lanza(() => syx.resolveColor('--semantic-color-inventado'), /does not exist/);
  lanza(() => syx.resolveColor('--semantic-space-component-md'), /not a colour/);
  lanza(() => syx.resolveColor('--semantic-color-primary', { format: 'cmyk' }), /unknown format/);
  lanza(() => syx.resolveColor('--semantic-color-primary', { theme: 'no-existe' }));
});

// ─── 2 · js/syx-colors.js con un DOM simulado ────────────────────────────────
// El navegador resuelve var() y color-mix() y devuelve el color calculado en
// su espacio; lo que se prueba aquí es lo que hace el script con esa cadena.

function dom(declarados, calculados) {
  const nodo = () => ({
    style: {}, setAttribute() {}, appendChild() {}, remove() {},
  });
  globalThis.document = { body: nodo(), documentElement: nodo(), createElement: nodo };
  globalThis.getComputedStyle = (el) => ({
    color: calculados[el.style.color] || '',
    getPropertyValue: (n) => declarados[n] || '',
  });
}

async function cargarNavegador() {
  const codigo = fs.readFileSync(path.join(ROOT, 'js', 'syx-colors.js'), 'utf8');
  return import('data:text/javascript;base64,' + Buffer.from(codigo).toString('base64'));
}

comprobar('js/syx-colors.js lee las serializaciones que devuelve un navegador', async () => {
  const m = await cargarNavegador();
  const casos = {
    'rgb(30, 58, 255)': '#1e3aff',
    'rgb(30 58 255)': '#1e3aff',
    'rgba(30, 58, 255, 0.5)': '#1e3aff80',
    'rgb(30 58 255 / 50%)': '#1e3aff80',
    'oklch(0.6279 0.2577 29.23)': '#ff0000',
    'oklch(0.452 0.3132 264.05deg)': '#0000ff',
    'oklch(1 0 none)': '#ffffff',
    'oklab(0.5198 -0.1404 0.1076)': '#008000',
    'color(srgb 1 0 0)': '#ff0000',
    'color(srgb-linear 1 1 1)': '#ffffff',
    'color(display-p3 1 0 0)': '#ff0000',
  };
  for (const [v, hex] of Object.entries(casos)) {
    const c = m.parseColor(v);
    const r = c && m.formatColor(c, 'hex');
    if (!r || !casiIgual(r.slice(0, 7), hex.slice(0, 7)) || r.slice(7) !== hex.slice(7)) throw new Error(`${v} → ${r}, esperaba ${hex}`);
  }
  if (m.parseColor('lab(50 20 30)') !== null) throw new Error('lab() no se lee: debería dar null, no un color');
});

comprobar('js/syx-colors.js da lo mismo que resolveColor() de Node en cada token', async () => {
  const m = await cargarNavegador();
  let n = 0;
  const malos = [];
  for (const { theme, mode } of contextos) {
    for (const [token, valor] of Object.entries(syx.listTokens({ theme, mode }).tokens)) {
      if (typeof valor !== 'string' || !/^(oklch\(\s*[\d.]|color-mix\()/.test(valor)) continue;
      let node;
      try { node = syx.resolveColor(token, { theme, mode, detailed: true }); } catch { continue; }
      if (node.alpha < 1) continue;
      n++;
      // Un oklch() literal es lo que el navegador devuelve tal cual; de una
      // mezcla, se le da el resultado que Node calcula, en oklch.
      const entrada = /^oklch/.test(valor) ? valor : syx.resolveColor(token, { theme, mode, format: 'oklch' });
      const nav = m.formatColor(m.parseColor(entrada), 'hex');
      if (!casiIgual(nav, node.hex)) malos.push(`${theme}/${mode} ${token}: navegador ${nav} ≠ Node ${node.hex}`);
    }
  }
  if (n < 500) throw new Error(`solo ${n} tokens comparados`);
  if (malos.length) throw new Error(`${malos.length} discrepancias: ${malos.slice(0, 3).join(' · ')}`);
});

comprobar('js/syx-colors.js resuelve por la sonda, avisa del token ausente y se publica en window.SYX', async () => {
  const valor = syx.getToken({ token: '--semantic-color-primary' }).value;
  dom({ '--semantic-color-primary': valor }, { 'var(--semantic-color-primary)': valor, red: 'rgb(255, 0, 0)' });
  const m = await cargarNavegador();
  const r = m.resolveColor('--semantic-color-primary');
  if (r !== syx.resolveColor('--semantic-color-primary')) throw new Error(`${r} ≠ ${syx.resolveColor('--semantic-color-primary')}`);
  if (m.resolveColor('red', { format: 'rgb' }) !== 'rgb(255, 0, 0)') throw new Error('un color CSS literal no se resuelve');
  const [a, b] = m.resolveColors(['var(--semantic-color-primary)', 'red']);
  if (a !== r || b !== '#ff0000') throw new Error(`resolveColors: ${a}, ${b}`);
  lanza(() => m.resolveColor('--semantic-color-inventado'), /not defined/);
  if (typeof globalThis.SYX?.resolveColor !== 'function') throw new Error('no deja window.SYX.resolveColor');
});

(async () => {
  console.log('\n── COLORES PARA CANVAS ─────────────────────────────────────────\n');
  let fallos = 0;
  for (const c of casos) {
    try {
      await c.fn();
      console.log(`✅ ${c.nombre}`);
    } catch (e) {
      fallos++;
      console.log(`❌ ${c.nombre}\n     ${e.message}`);
    }
  }
  console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
  process.exit(fallos ? 1 : 0);
})();
