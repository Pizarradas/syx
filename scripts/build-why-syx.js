#!/usr/bin/env node
/**
 * SYX — Las puntuaciones de why-syx.html salen de un solo sitio
 * ─────────────────────────────────────────────────────────────
 * La comparativa repetía las mismas catorce puntuaciones en la matriz, el
 * total, la clasificación y seis perfiles ponderados, todo escrito a mano: al
 * cambiar una nota había que rehacer a mano 8 bloques y sus porcentajes, y la
 * auditoría de octubre II encontró la página contando datos caducados.
 *
 * Ahora las notas y los pesos viven en contracts/why-syx.json, y esto genera,
 * entre marcas `<!-- why-syx:<bloque> -->…<!-- /why-syx:<bloque> -->`:
 *   veredicto   la frase de cabecera sobre el total
 *   matriz      la tabla de catorce criterios con su fila de totales
 *   total       la clasificación sin ponderar
 *   perfiles    la frase de la sección de perfiles
 *   perfil-<id> cada perfil: su frase, su clasificación y sus pesos
 *   versiones   la línea de versiones evaluadas
 *
 * Media ponderada = Σ(peso × nota) / Σ(peso). Empates: misma posición
 * (1, 2, 2, 4). La barra es la nota sobre la mejor del bloque.
 *
 * Uso: node scripts/build-why-syx.js [--check]   ·   npm run build:why-syx / check:why-syx
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGINA = path.join(ROOT, 'why-syx.html');
const datos = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts', 'why-syx.json'), 'utf8'));
const { criterios, evidencia } = datos._meta;
const sistemas = datos.sistemas;
const N = criterios.length;

for (const s of sistemas) if (s.puntos.length !== N) throw new Error(`why-syx.json: ${s.id} tiene ${s.puntos.length} notas, no ${N}`);
for (const p of datos.perfiles) if (p.pesos.length !== N) throw new Error(`why-syx.json: el perfil ${p.id} tiene ${p.pesos.length} pesos, no ${N}`);

const ETIQUETA = { measured: 'Measured', checkable: 'Checkable', judged: 'Judged' };
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];
const esc = (s) => s.replace(/&(?!amp;|[a-z]+;)/g, '&amp;');
const fijo = (n, d) => n.toFixed(d);

/** Posiciones con empates: [{s, v, pos}] ordenado. */
function clasificar(valor) {
  const filas = sistemas.map((s) => ({ s, v: valor(s) })).sort((a, b) => b.v - a.v || sistemas.indexOf(a.s) - sistemas.indexOf(b.s));
  filas.forEach((f, i) => { f.pos = i > 0 && Math.abs(f.v - filas[i - 1].v) < 1e-9 ? filas[i - 1].pos : i + 1; });
  return filas;
}

const total = (s) => s.puntos.reduce((a, b) => a + b, 0);
const ponderada = (p) => (s) => s.puntos.reduce((a, n, i) => a + n * p.pesos[i], 0) / p.pesos.reduce((a, b) => a + b, 0);

function filaRanking(f, max, nombre, pts, sobre, sangria) {
  return [
    `${sangria}<li class="mol-ranking__row">`,
    `${sangria}    <span class="mol-ranking__pos">${f.pos}</span>`,
    `${sangria}    <span class="mol-ranking__name">${nombre}</span>`,
    `${sangria}    <span class="mol-ranking__bar"><span class="mol-ranking__fill" style="width:${fijo((f.v / max) * 100, 1)}%"></span></span>`,
    `${sangria}    <span class="mol-ranking__pts"><strong>${pts}</strong> / ${sobre}</span>`,
    `${sangria}</li>`,
  ].join('\n');
}

const bloques = {};

// ─── Matriz ──────────────────────────────────────────────────────────────────
{
  const S = '                    ';
  const filas = criterios.map((c, i) => {
    const max = Math.max(...sistemas.map((s) => s.puntos[i]));
    const celdas = sistemas.map((s) => {
      const n = s.puntos[i];
      return n === max
        ? `${S}        <td><span class="atom-score atom-score--${n} atom-score--top" title="Highest in this row">${n}</span></td>`
        : `${S}        <td><span class="atom-score atom-score--${n}">${n}</span></td>`;
    });
    return [
      `${S}    <tr>`,
      `${S}        <td style="text-align:left"><strong>${esc(c)}</strong></td>`,
      `${S}        <td><span class="atom-evidence atom-evidence--${evidencia[i]}">${ETIQUETA[evidencia[i]]}</span></td>`,
      ...celdas,
      `${S}    </tr>`,
    ].join('\n');
  });
  bloques.matriz = [
    `${S}<table class="atom-table" style="min-width:1200px;text-align:center">`,
    `${S}    <thead>`,
    `${S}        <tr>`,
    `${S}            <th style="text-align:left">Criterion</th>`,
    `${S}            <th>Evidence</th>`,
    ...sistemas.map((s) => `${S}            <th>${s.id === 'tailwind' ? 'Tailwind' : s.id === 'mui' ? 'MUI' : s.nombre}</th>`),
    `${S}        </tr>`,
    `${S}    </thead>`,
    `${S}    <tbody>`,
    ...filas,
    `${S}    </tbody>`,
    `${S}    <tfoot>`,
    `${S}        <tr>`,
    `${S}            <th scope="row" style="text-align:left">Total</th>`,
    `${S}            <td><strong>/ ${N * 5}</strong></td>`,
    ...sistemas.map((s) => `${S}            <td><strong>${total(s)}</strong></td>`),
    `${S}        </tr>`,
    `${S}    </tfoot>`,
    `${S}</table>`,
  ].join('\n');
}

// ─── Total sin ponderar ──────────────────────────────────────────────────────
const rTotal = clasificar(total);
{
  const S = '                ';
  const top = rTotal.filter((f) => f.pos === 1);
  const resto = rTotal.filter((f) => f.pos !== 1);
  const max = rTotal[0].v;
  const nombres = top.map((f) => f.s.nombre).join(' · ');
  const frase = top.length > 1
    ? `Tied on ${max}. The total cannot separate them — the weighted profiles below can, and they disagree.`
    : (datos.textos && datos.textos.ganador && datos.textos.ganador[top[0].s.id]) || '';
  bloques.total = [
    `${S}<div class="layout-grid__nested syx-mb-4">`,
    `${S}    <div class="layout-grid__col-xs-12 layout-grid__col-md-4">`,
    `${S}        <div class="mol-ranking__winner">`,
    `${S}            <span class="mol-ranking__medal">`,
    `${S}                <span class="atom-icon atom-icon--lc-award" aria-hidden="true"></span>`,
    `${S}            </span>`,
    `${S}            <p class="syx-type-overline mol-ranking__rank">1st place${top.length > 1 ? ' (tied)' : ''}</p>`,
    `${S}            <h3 class="atom-title atom-title--h3 syx-mb-2">${nombres}</h3>`,
    `${S}            <p class="mol-ranking__score">${max}<span class="mol-ranking__max">/ ${N * 5}</span></p>`,
    `${S}            <p class="atom-txt syx-text-gray syx-mb-0">${frase}</p>`,
    `${S}        </div>`,
    `${S}    </div>`,
    `${S}    <div class="layout-grid__col-xs-12 layout-grid__col-md-8">`,
    `${S}        <ol class="mol-ranking">`,
    ...resto.map((f) => filaRanking(f, max, f.s.nombre, f.v, N * 5, `${S}            `)),
    `${S}        </ol>`,
    `${S}    </div>`,
    `${S}</div>`,
  ].join('\n');

  const syx = rTotal.find((f) => f.s.id === 'syx');
  const otros = rTotal.filter((f) => f.pos === syx.pos && f.s.id !== 'syx').map((f) => f.s.nombre);
  bloques.veredicto = syx.pos === 1
    ? (otros.length
      ? `<strong>SYX ties for first on the overall total</strong>, with ${otros.join(' and ')}, at ${syx.v} of ${N * 5}. Where it wins, and where it loses badly, is below.`
      : `<strong>SYX wins the overall total</strong>, at ${syx.v} of ${N * 5}. Where it wins, and where it loses badly, is below.`)
    : `<strong>SYX does not win the overall total.</strong> It comes ${ORD[syx.pos - 1]}, at ${syx.v} of ${N * 5}. Where it wins, and where it loses badly, is below.`;
}

// ─── Perfiles ────────────────────────────────────────────────────────────────
{
  let primero = 0, ultimo = 0;
  for (const p of datos.perfiles) {
    const S = '                    ';
    const r = clasificar(ponderada(p));
    const max = r[0].v;
    const syx = r.find((f) => f.s.id === 'syx');
    const peor = Math.max(...r.map((f) => f.pos));
    if (syx.pos === 1) primero++;
    if (syx.pos === peor) ultimo++;
    const empatados = r.filter((f) => f.pos === syx.pos && f.s.id !== 'syx').map((f) => f.s.corto);
    const frase = syx.pos === 1
      ? (empatados.length ? `SYX ties for first here, with ${empatados.join(' and ')}.` : 'SYX leads this profile.')
      : `<strong>SYX comes ${ORD[syx.pos - 1]} of ${r.length} here.</strong>`;
    bloques[`perfil-${p.id}`] = [
      `${S}<p class="atom-txt syx-mb-3" style="font-size:0.9rem">${frase}</p>`,
      `${S}<ol class="mol-ranking syx-mb-3">`,
      ...r.map((f) => filaRanking(f, max, f.s.corto, fijo(f.v, 2), 5, `${S}    `)),
      `${S}</ol>`,
      `${S}<p class="syx-type-overline syx-text-gray syx-mb-1">Weights, criteria 1&ndash;${N}</p>`,
      `${S}<p class="atom-txt syx-mb-0"><code>${p.pesos.join(' · ')}</code></p>`,
    ].join('\n');
  }
  const n = datos.perfiles.length;
  const palabra = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];
  bloques.perfiles = `SYX comes first in ${palabra[primero]} of these and <strong>last in ${palabra[ultimo]}</strong>.`;
  if (ultimo === 0) bloques.perfiles = `SYX comes first in ${palabra[primero]} of these${n - primero ? `, and is never last` : ''}.`;
}

// ─── Versiones ───────────────────────────────────────────────────────────────
bloques.versiones = sistemas
  .map((s) => (s.id === 'shadcn' ? 'Shadcn UI (2026 registry)' : `${s.nombre} ${s.id === 'syx' ? 'v' : ''}${s.version}`))
  .join(' &nbsp;·&nbsp; ');

// ─── Escribir o comprobar ────────────────────────────────────────────────────
const html = fs.readFileSync(PAGINA, 'utf8');
let nuevo = html;
const faltan = [];
for (const [k, v] of Object.entries(bloques)) {
  const re = new RegExp(`(<!-- why-syx:${k} -->)[\\s\\S]*?(<!-- /why-syx:${k} -->)`);
  if (!re.test(nuevo)) { faltan.push(k); continue; }
  const enLinea = !v.includes('\n');
  nuevo = nuevo.replace(re, (m, a, b) => (enLinea ? `${a}${v}${b}` : `${a}\n${v}\n${' '.repeat(16)}${b}`));
}
if (faltan.length) { console.error(`✗ why-syx.html no tiene las marcas: ${faltan.join(', ')}`); process.exit(1); }

if (process.argv.includes('--check')) {
  // La versión evaluada de SYX es la publicada: si no, la página compara otra.
  const paquete = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  const evaluada = sistemas.find((s) => s.id === 'syx').version;
  if (evaluada !== paquete) {
    console.error(`✗ check:why-syx — la comparativa evalúa SYX ${evaluada} y el paquete es ${paquete}. Vuelve a medir y actualiza contracts/why-syx.json.`);
    process.exit(1);
  }
  if (nuevo !== html) {
    console.error('✗ check:why-syx — why-syx.html no coincide con contracts/why-syx.json. Ejecuta: npm run build:why-syx');
    process.exit(1);
  }
  console.log(`✓ check:why-syx — ${N} criterios × ${sistemas.length} sistemas y ${datos.perfiles.length} perfiles coinciden con contracts/why-syx.json`);
} else {
  fs.writeFileSync(PAGINA, nuevo);
  console.log(`✓ build:why-syx — total: ${rTotal.map((f) => `${f.pos}. ${f.s.corto} ${f.v}`).join(' · ')}`);
}
