#!/usr/bin/env node
/**
 * generate-tokens.mjs — la sección Tokens del catálogo HTML.
 *
 * Lee tokens.json (el registro real del sistema) y emite
 * stories/tokens.stories.js con galerías cuyo color vivo es `var(--token)`:
 * al cambiar tema o modo en la toolbar, las muestras repintan solas, porque
 * son el mismo custom property que usan los componentes. Los valores de
 * texto (rawValue) son los del registro. Corre después de
 * generate-stories.mjs porque ese generador vacía stories/.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(HERE, '..', 'tokens.json'), 'utf8'));

const MONO = 'font-family:ui-monospace,Consolas,monospace;font-size:.75rem';
const WRAP = 'max-width:64rem;margin:0 auto';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function swatchCard(name, raw) {
  return (
    `<div style="display:flex;flex-direction:column;gap:.35rem">` +
    `<div style="height:3.5rem;border-radius:8px;border:1px solid rgba(128,128,128,.35);background:var(${name})"></div>` +
    `<span style="${MONO}">${esc(name)}</span>` +
    `<span style="${MONO};opacity:.6">${esc(raw)}</span>` +
    `</div>`
  );
}

function table(rows) {
  return (
    `<table style="border-collapse:collapse;width:100%">` +
    `<tbody>${rows.join('')}</tbody></table>`
  );
}

function row(name, raw, sample = '') {
  return (
    `<tr style="border-bottom:1px solid rgba(128,128,128,.2)">` +
    `<td style="padding:.4rem .75rem .4rem 0;${MONO};white-space:nowrap">${esc(name)}</td>` +
    `<td style="padding:.4rem .75rem;${MONO};opacity:.65">${esc(raw)}</td>` +
    `<td style="padding:.4rem 0;width:9rem">${sample}</td>` +
    `</tr>`
  );
}

const isColor = (name, def) => def.type === 'COLOR' || /color|bg|border(?!-width|-radius)/.test(name);
const colorDot = (name) =>
  `<span style="display:inline-block;width:1.6rem;height:1.6rem;border-radius:50%;border:1px solid rgba(128,128,128,.35);background:var(${name});vertical-align:middle"></span>`;

// ── Primitivos: color ────────────────────────────────────────────────────
const primColors = Object.entries(tokens.primitives).filter(([, d]) => d.type === 'COLOR');
const COLORES =
  `<div style="${WRAP}"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(11rem,1fr));gap:1rem">` +
  primColors.map(([n, d]) => swatchCard(n, d.rawValue)).join('') +
  `</div></div>`;

// ── Primitivos: escalas (todo lo que no es color, agrupado por familia) ──
const familia = (key) => key.replace(/-\d+.*$|-(none|sm|md|lg|xl|xxl|base|full).*$/, '');
const primRest = Object.entries(tokens.primitives).filter(([, d]) => d.type !== 'COLOR');
const grupos = {};
for (const [n, d] of primRest) (grupos[familia(d.key)] ??= []).push([n, d]);
const ESCALAS =
  `<div style="${WRAP}">` +
  Object.entries(grupos)
    .map(
      ([g, entries]) =>
        `<h3 style="font-family:system-ui;font-size:.9rem;margin:1.5rem 0 .5rem">${esc(g)} <span style="opacity:.5">(${entries.length})</span></h3>` +
        table(entries.map(([n, d]) => row(n, d.rawValue)))
    )
    .join('') +
  `</div>`;

// ── Semánticos: nombre → alias, con muestra viva si es de color ──────────
const SEMANTICOS =
  `<div style="${WRAP}">` +
  table(
    Object.entries(tokens.semantic).map(([n, d]) =>
      row(n, d.rawValue, isColor(n, d) ? colorDot(n) : '')
    )
  ) +
  `</div>`;

// ── De componente: 631 tokens plegados por componente ────────────────────
const porComponente = {};
for (const [n, d] of Object.entries(tokens.component)) {
  (porComponente[d.key.split('-')[0]] ??= []).push([n, d]);
}
const COMPONENTE =
  `<div style="${WRAP}">` +
  Object.entries(porComponente)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([comp, entries]) =>
        `<details style="margin-bottom:.5rem"><summary style="font-family:system-ui;font-size:.9rem;cursor:pointer;padding:.3rem 0">${esc(comp)} <span style="opacity:.5">(${entries.length})</span></summary>` +
        table(entries.map(([n, d]) => row(n, d.rawValue, isColor(n, d) ? colorDot(n) : ''))) +
        `</details>`
    )
    .join('') +
  `</div>`;

const file = `// GENERADO por generate-tokens.mjs desde tokens.json — no editar a mano.
// Las muestras usan var(--token): cambian en vivo con la toolbar de tema/modo.

export default {
  title: 'Tokens',
  parameters: { layout: 'padded', controls: { disable: true } },
};

export const Colores = { render: () => ${JSON.stringify(COLORES)} };
export const Escalas = { render: () => ${JSON.stringify(ESCALAS)} };
export const Semanticos = { name: 'Semánticos', render: () => ${JSON.stringify(SEMANTICOS)} };
export const DeComponente = { name: 'De componente', render: () => ${JSON.stringify(COMPONENTE)} };
`;

writeFileSync(join(HERE, 'stories', 'tokens.stories.js'), file);
console.log(
  `tokens.stories.js: ${primColors.length} colores primitivos, ${primRest.length} escalas, ` +
    `${Object.keys(tokens.semantic).length} semánticos, ${Object.keys(tokens.component).length} de componente (${Object.keys(porComponente).length} grupos)`
);
