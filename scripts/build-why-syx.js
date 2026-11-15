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
 *   coste-tokens la tabla de coste en tokens, desde
 *               docs/why-syx/coste-tokens/medicion.json (lo escribe medir.mjs)
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

// ─── Coste en tokens ─────────────────────────────────────────────────────────
// Lo mide docs/why-syx/coste-tokens/medir.mjs (necesita la API de Anthropic,
// así que no corre en la CI); aquí solo se pinta medicion.json: tres cifras,
// dos gráficos (leído, apilado por página; escrito, con SYX resaltado) y la
// tabla, que es la versión en texto de los dos gráficos.
const MEDICION = path.join(ROOT, 'docs', 'why-syx', 'coste-tokens', 'medicion.json');
if (!fs.existsSync(MEDICION)) {
  // Sin medir todavía: un aviso visible en vez de un hueco, y ninguna cifra.
  bloques['coste-tokens'] = [
    '                <div class="mol-alert mol-alert--info" role="note">',
    '                    <p class="mol-alert__title">Not measured yet</p>',
    '                    <p class="mol-alert__body">The charts and the table appear here once the counts exist. They need the Anthropic API, so they are not run in CI: <code>docs/why-syx/coste-tokens/medir.mjs</code> writes <code>medicion.json</code>, and <code>npm run build:why-syx</code> draws it. No figure is shown until then, on purpose.</p>',
    '                </div>',
  ].join('\n');
} else {
  const medicion = JSON.parse(fs.readFileSync(MEDICION, 'utf8'));
  const ROLES = [
    ['setup', 'Install'],
    ['button', 'Button'],
    ['field', 'Field + error'],
    ['card', 'Card'],
    ['dialog', 'Dialog'],
  ];
  const n = (x) => (x == null ? '&mdash;' : x.toLocaleString('en-US'));
  const pct = (x, max) => (x / max).toFixed(4);
  const filas = sistemas.map((s) => {
    const c = medicion.contexto[s.id];
    const o = medicion.salida[s.id];
    if (!c || o == null) throw new Error(`medicion.json no tiene a ${s.id}`);
    return { s, c, lee: c.total, escribe: o, total: c.total + o };
  });
  const min = (k) => Math.min(...filas.map((f) => f[k]));
  const marca = (f, k) => (f[k] === min(k) ? `<strong>${n(f[k])}</strong>` : n(f[k]));
  const orden = [...filas].sort((a, b) => a.total - b.total);
  const posSyx = orden.findIndex((f) => f.s.id === 'syx') + 1;
  const syx = filas.find((f) => f.s.id === 'syx');
  const otros = filas.filter((f) => f.s.id !== 'syx').map((f) => f.total).sort((a, b) => a - b);
  const mediana = (otros[2] + otros[3]) / 2;
  const veces = (a, b) => (b / a).toFixed(1).replace(/\.0$/, '');
  const ultimo = orden[orden.length - 1];
  const frase = posSyx === 1
    ? `<strong>SYX is the cheapest of the seven for this task</strong>: ${n(syx.total)} tokens, read and written. The next is ${orden[1].s.nombre} at ${n(orden[1].total)}; the most expensive, ${ultimo.s.nombre}, costs ${veces(syx.total, ultimo.total)}× as much.`
    : `<strong>SYX comes ${ORD[posSyx - 1]} of seven for this task</strong>, at ${n(syx.total)} tokens read and written; ${orden[0].s.nombre} is the cheapest at ${n(orden[0].total)}.`;
  const S = '                ';

  // Tres cifras. La tercera dice cuánto respecto a la mediana de los otros
  // seis, en el sentido que toque: «× less» o «× more».
  const rel = syx.total <= mediana
    ? [`${veces(syx.total, mediana)}×`, 'fewer than the median of the other six']
    : [`${veces(mediana, syx.total)}×`, 'more than the median of the other six'];
  const tiles = [
    [n(syx.lee), 'Tokens SYX hands an agent to read'],
    [n(syx.escribe), 'Tokens of SYX code the agent writes'],
    rel,
  ];
  const kpi = [
    `${S}<div class="layout-grid__nested syx-mb-4">`,
    ...tiles.map(([v, l]) => [
      `${S}    <div class="layout-grid__col-xs-12 layout-grid__col-md-4">`,
      `${S}        <div class="atom-stat"><span class="atom-stat__number">${v}</span><span class="atom-stat__label">${l}</span></div>`,
      `${S}    </div>`,
    ].join('\n')),
    `${S}</div>`,
  ];

  // Gráfico 1 — leído, apilado por página, de menos a más.
  const porLeido = [...filas].sort((a, b) => a.lee - b.lee);
  const maxLee = porLeido[porLeido.length - 1].lee;
  const g1 = [
    `${S}<figure class="mol-token-chart syx-mb-4" aria-labelledby="tc-read-title">`,
    `${S}    <p class="mol-token-chart__title" id="tc-read-title">Tokens read, by page</p>`,
    `${S}    <p class="mol-token-chart__note">The official page for each part, whole. Fewest first. Hover a segment, or focus a row, for its figures.</p>`,
    `${S}    <ul class="mol-token-chart__legend">`,
    ...ROLES.map(([, nombre], i) => `${S}        <li class="mol-token-chart__key"><span class="mol-token-chart__swatch mol-token-chart__swatch--${i + 1}" aria-hidden="true"></span>${nombre}</li>`),
    `${S}    </ul>`,
    `${S}    <ol class="mol-token-chart__rows">`,
    ...porLeido.map((f) => {
      const partes = ROLES.map(([k, nombre], i) => ({ k, nombre, i, v: f.c[k] })).filter((p) => p.v != null);
      const tip = [`${f.s.nombre}: ${f.lee.toLocaleString('en-US')} read`, ...partes.map((p) => `${p.nombre}: ${p.v.toLocaleString('en-US')}`)].join('&#10;');
      const etiqueta = `${f.s.nombre}, ${f.lee.toLocaleString('en-US')} tokens read: ${partes.map((p) => `${p.nombre.toLowerCase()} ${p.v.toLocaleString('en-US')}`).join(', ')}`;
      return [
        `${S}        <li class="mol-token-chart__row${f.s.id === 'syx' ? ' mol-token-chart__row--accent' : ''}" tabindex="0" aria-label="${etiqueta}" data-tip="${tip}">`,
        `${S}            <span class="mol-token-chart__name" aria-hidden="true">${f.s.nombre}</span>`,
        `${S}            <span class="mol-token-chart__track" aria-hidden="true">`,
        ...partes.map((p) => `${S}                <span class="mol-token-chart__seg mol-token-chart__seg--${p.i + 1}" style="--component-token-chart-share:${pct(p.v, maxLee)}" data-tip="${p.nombre}: ${p.v.toLocaleString('en-US')}"></span>`),
        `${S}                <span class="mol-token-chart__value">${n(f.lee)}</span>`,
        `${S}            </span>`,
        `${S}        </li>`,
      ].join('\n');
    }),
    `${S}    </ol>`,
    `${S}</figure>`,
  ];

  // Gráfico 2 — escrito, de menos a más, SYX en el color del tema y los demás
  // en gris: la historia es dónde cae uno, no siete series.
  const porEscrito = [...filas].sort((a, b) => a.escribe - b.escribe);
  const maxEsc = porEscrito[porEscrito.length - 1].escribe;
  const g2 = [
    `${S}<figure class="mol-token-chart syx-mb-4" aria-labelledby="tc-written-title">`,
    `${S}    <p class="mol-token-chart__title" id="tc-written-title">Tokens written, same screen</p>`,
    `${S}    <p class="mol-token-chart__note">The code for the screen, written the way each system&rsquo;s own examples write it. Fewest first; SYX in the theme&rsquo;s colour.</p>`,
    `${S}    <ol class="mol-token-chart__rows">`,
    ...porEscrito.map((f) => [
      `${S}        <li class="mol-token-chart__row${f.s.id === 'syx' ? ' mol-token-chart__row--accent' : ''}" tabindex="0" aria-label="${f.s.nombre}, ${f.escribe.toLocaleString('en-US')} tokens written" data-tip="${f.s.nombre}: ${f.escribe.toLocaleString('en-US')} written">`,
      `${S}            <span class="mol-token-chart__name" aria-hidden="true">${f.s.nombre}</span>`,
      `${S}            <span class="mol-token-chart__track" aria-hidden="true">`,
      `${S}                <span class="mol-token-chart__seg${f.s.id === 'syx' ? ' mol-token-chart__seg--accent' : ''}" style="--component-token-chart-share:${pct(f.escribe, maxEsc)}"></span>`,
      `${S}                <span class="mol-token-chart__value">${n(f.escribe)}</span>`,
      `${S}            </span>`,
      `${S}        </li>`,
    ].join('\n')),
    `${S}    </ol>`,
    `${S}</figure>`,
  ];

  const tabla = [
    `${S}<p class="mol-token-chart__title" id="tc-table-title">The figures</p>`,
    `${S}<div class="syx-border syx-bg-gray-50 syx-p-3 syx-mb-2 syx-overflow-auto" role="region" tabindex="0" aria-labelledby="tc-table-title">`,
    `${S}    <table class="atom-table" style="min-width:900px;text-align:right">`,
    `${S}        <thead>`,
    `${S}            <tr>`,
    `${S}                <th style="text-align:left">System</th>`,
    ...ROLES.map(([, nombre]) => `${S}                <th>${nombre}</th>`),
    `${S}                <th>Read</th>`,
    `${S}                <th>Written</th>`,
    `${S}                <th>Total</th>`,
    `${S}            </tr>`,
    `${S}        </thead>`,
    `${S}        <tbody>`,
    ...orden.map((f) => [
      `${S}            <tr>`,
      `${S}                <th scope="row" style="text-align:left">${f.s.nombre}</th>`,
      ...ROLES.map(([k]) => `${S}                <td>${n(f.c[k])}</td>`),
      `${S}                <td>${marca(f, 'lee')}</td>`,
      `${S}                <td>${marca(f, 'escribe')}</td>`,
      `${S}                <td>${marca(f, 'total')}</td>`,
      `${S}            </tr>`,
    ].join('\n')),
    `${S}        </tbody>`,
    `${S}    </table>`,
    `${S}</div>`,
    `${S}<p class="atom-txt syx-text-gray syx-mb-0" style="font-size:0.85rem">Tokens, counted with <code>count_tokens</code> and <code>${medicion.modelo}</code> on ${medicion.medido}. Ordered by total; lowest in each total column in bold. Tailwind&rsquo;s &ldquo;Button&rdquo; column is its core-concepts page: it has no component pages. Method, sources, hashes and the seven implementations: <code>docs/why-syx/coste-tokens/</code>.</p>`,
  ];

  bloques['coste-tokens'] = [`${S}<p class="atom-txt syx-mb-3">${frase}</p>`, ...kpi, ...g1, ...g2, ...tabla].join('\n');
}

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
