#!/usr/bin/env node
/**
 * SYX — Guardián de confianza sobre el diff
 * ─────────────────────────────────────────
 * Clasifica lo que cambia una rama respecto a su base con contracts/trust.json
 * y falla si toca rutas `human` sin una aprobación explícita.
 *
 * POR QUÉ EXISTE
 * Hasta la auditoría de octubre de 2026, trust.json no se aplicaba en ningún
 * merge. Lo consultaban propose.js y la herramienta MCP, es decir, solo quien
 * PREGUNTABA. Mover `scripts/` a `auto` en el propio trust.json pasaba la
 * cadena entera y check:propuesta. Un permiso que solo respeta quien quiere
 * es una sugerencia.
 *
 * QUÉ APRUEBA DE VERDAD, Y QUÉ NO
 * En GitHub, la aprobación que bloquea un merge es la revisión de un
 * CODEOWNER (.github/CODEOWNERS, generado de trust.json) con la protección de
 * rama exigiéndola. Este job no la sustituye: la API de revisiones no está
 * garantizada desde la CI y leerla convertiría el guardián en un cliente de
 * GitHub. Lo que hace es más modesto y se dice tal cual:
 *   · lista qué rutas son `human` y `pr`, en el resumen del job, para que
 *     quien revisa no tenga que deducirlo del diff;
 *   · exige que un PR que toca `human` lleve la etiqueta `aprobado-humano`,
 *     leída del evento de la PR. Poner etiquetas requiere permiso de triage o
 *     escritura en el repositorio, así que es una declaración de alguien con
 *     permisos — no una prueba de que esa persona revisó el diff.
 * Por eso el resumen lo repite: la etiqueta desbloquea este job; la revisión
 * de CODEOWNERS es la que desbloquea el merge.
 *
 * DE DÓNDE SALE LA BASE
 *   1. `--base <ref>` o el primer argumento
 *   2. la variable SYX_BASE
 *   3. en la CI de una PR, `origin/$GITHUB_BASE_REF`
 * Sin ninguna, se salta con un aviso y sale 0. En local no hay forma honrada
 * de saber contra qué se va a fusionar una rama, y adivinar `main` daría
 * veredictos sobre un diff que nadie va a proponer. Por eso no está en la
 * cadena `npm run check`: está en la CI, que sí sabe la base.
 *
 * CON QUÉ CONTRATO SE JUZGA
 * Con el trust.json de la BASE, no con el de la rama. Si no, una PR que bajara
 * `scripts/` a `auto` en su propio trust.json se clasificaría con ese contrato
 * y se aprobaría a sí misma — que es exactamente el hallazgo que dio origen a
 * esto. Por la misma razón la CI ejecuta este script tal como está en la base
 * (`--repo` apunta al clon de la PR): una PR no reescribe a su propio juez.
 *
 * Uso:
 *   node scripts/check-confianza.js --base origin/main [--repo <clon>]
 *   SYX_BASE=audit/octubre npm run check:confianza
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { clasificarCambios, contrato } = require('./lib/confianza');

const ROOT = path.join(__dirname, '..');
const argRepo = process.argv.indexOf('--repo');
const REPO = argRepo > -1 && process.argv[argRepo + 1] ? path.resolve(process.argv[argRepo + 1]) : ROOT;
const ETIQUETA = 'aprobado-humano';

const enCI = !!process.env.GITHUB_ACTIONS;
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

console.log('\n── CONFIANZA DEL DIFF ──────────────────────────────────────────\n');

// ─── La base ─────────────────────────────────────────────────────────────────

function base() {
  const i = process.argv.indexOf('--base');
  if (i > -1 && process.argv[i + 1]) return process.argv[i + 1];
  const posicional = process.argv.slice(2).find((a, i, todos) => !a.startsWith('--') && todos[i - 1] !== '--repo');
  if (posicional) return posicional;
  if (process.env.SYX_BASE) return process.env.SYX_BASE;
  if (process.env.GITHUB_BASE_REF) return `origin/${process.env.GITHUB_BASE_REF}`;
  return null;
}

const ref = base();
if (!ref) {
  console.log('⚠️  Sin base, no hay diff que clasificar: se salta.');
  console.log('   Pásala con --base <ref> o SYX_BASE=<ref>. En la CI de una PR se toma');
  console.log('   sola de GITHUB_BASE_REF.\n');
  process.exit(0);
}

try {
  git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
} catch (e) {
  // En la CI esto es un fallo de configuración (checkout sin historia), no un
  // «no hay cambios»: dar verde aquí sería aprobar sin mirar.
  console.log(`❌ La base «${ref}» no existe en este clon.`);
  console.log('   En la CI, el checkout necesita `fetch-depth: 0` para tener la rama base.\n');
  process.exit(1);
}

// ─── El diff ─────────────────────────────────────────────────────────────────
// `...`: lo que la rama añade desde que se separó de la base, no lo que la base
// haya avanzado mientras tanto. `--no-renames`: mover un fichero `human` fuera
// de su carpeta también es tocarlo, y con la detección de renombrados solo
// aparecería el destino. `-z`: rutas con espacios o acentos sin comillas.
const rutas = git('diff', '--name-only', '--no-renames', '-z', `${ref}...HEAD`)
  .split('\0')
  .filter(Boolean);

// ─── El contrato de la base ──────────────────────────────────────────────────
// Si la base aún no tiene trust.json (la PR que lo introduce), no hay contrato
// anterior que respetar y se usa el del disco: no hay nada que eludir todavía.
let contratoBase = null;
let origenContrato = `${ref}:contracts/trust.json`;
try {
  contratoBase = JSON.parse(git('show', `${ref}:contracts/trust.json`));
} catch (e) {
  contratoBase = contrato();
  origenContrato = 'contracts/trust.json del disco (la base no tiene uno)';
}
const opciones = { contrato: contratoBase, raiz: REPO };

// ─── La aprobación ───────────────────────────────────────────────────────────

function etiquetas() {
  const f = process.env.GITHUB_EVENT_PATH;
  if (!f || !fs.existsSync(f)) return { leidas: false, lista: [] };
  try {
    const ev = JSON.parse(fs.readFileSync(f, 'utf8'));
    const pr = ev.pull_request;
    if (!pr) return { leidas: false, lista: [] };
    return { leidas: true, lista: (pr.labels || []).map((l) => l.name) };
  } catch (e) {
    return { leidas: false, lista: [] };
  }
}

// ─── Veredicto ───────────────────────────────────────────────────────────────

const v = rutas.length ? clasificarCambios(rutas, opciones) : { tier: 'auto', detalle: [] };
const de = (t) => v.detalle.filter((d) => d.tier === t);
const humanas = de('human');
const propuestas = de('pr');
const automaticas = de('auto');
const et = etiquetas();
const aprobado = et.lista.includes(ETIQUETA);

const marca = { auto: '·', pr: '→', human: '✋' };
console.log(`   base         ${ref}`);
console.log(`   contrato     ${origenContrato}`);
console.log(`   cambios      ${rutas.length} fichero(s)\n`);
for (const d of [...humanas, ...propuestas, ...automaticas]) {
  console.log(`   ${marca[d.tier]} ${d.tier.padEnd(6)} ${d.path}${d.porDefecto ? '   (por defecto)' : ''}`);
}
if (rutas.length) console.log(`\n   Veredicto: ${contratoBase.tiers[v.tier].label.toUpperCase()}`);

// ─── Resumen del job ─────────────────────────────────────────────────────────

if (process.env.GITHUB_STEP_SUMMARY) {
  const tabla = (lista) => lista.length
    ? ['| Ruta | Patrón |', '|---|---|', ...lista.map((d) => `| \`${d.path}\` | ${d.patron ? `\`${d.patron}\`` : '*por defecto*'} |`)].join('\n')
    : '_ninguna_';
  const md = [
    '## Confianza del cambio',
    '',
    `Base \`${ref}\` · juzgado con \`${origenContrato}\` · ${rutas.length} fichero(s) · veredicto **${rutas.length ? contratoBase.tiers[v.tier].label : '—'}**`,
    '',
    `### ✋ Solo humano (${humanas.length})`,
    '',
    tabla(humanas),
    '',
    `### → Vía propuesta (${propuestas.length})`,
    '',
    tabla(propuestas),
    '',
    `<details><summary>· Automático (${automaticas.length})</summary>\n\n${tabla(automaticas)}\n\n</details>`,
    '',
    humanas.length
      ? (aprobado
        ? `**Etiqueta \`${ETIQUETA}\` presente** — este job pasa.`
        : `**Falta la etiqueta \`${ETIQUETA}\`** — este job falla hasta que alguien con permisos la ponga.`)
      : 'No toca rutas `human`: no hace falta etiqueta.',
    '',
    '> La etiqueta desbloquea este job; no prueba que nadie haya leído el diff. Lo que bloquea el merge es la revisión de CODEOWNERS (`.github/CODEOWNERS`, generado de `contracts/trust.json`) con la protección de rama exigiéndola.',
    '',
  ].join('\n');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}

// ─── Salida ──────────────────────────────────────────────────────────────────

if (!humanas.length) {
  console.log(`\n✅ Nada «solo humano» en el diff.${propuestas.length ? ` ${propuestas.length} ruta(s) en vía propuesta: las revisa CODEOWNERS.` : ''}\n`);
  process.exit(0);
}

if (aprobado) {
  console.log(`\n✅ Toca ${humanas.length} ruta(s) «solo humano» y la PR lleva la etiqueta «${ETIQUETA}».`);
  console.log('   La etiqueta no sustituye a la revisión de CODEOWNERS: esa es la que bloquea el merge.\n');
  process.exit(0);
}

const motivo = et.leidas
  ? `la PR no lleva la etiqueta «${ETIQUETA}»`
  : `no hay evento de PR del que leer la etiqueta «${ETIQUETA}» (¿se ejecuta fuera de una pull_request?)`;
console.log(`\n❌ Toca ${humanas.length} ruta(s) «solo humano» y ${motivo}.`);
console.log('   Un agente puede analizar y recomendar ahí, no escribir. Si el cambio es de');
console.log(`   una persona, o una persona lo ha revisado, que alguien con permisos ponga la`);
console.log(`   etiqueta «${ETIQUETA}» a la PR.\n`);
if (enCI) console.log(`::error title=Confianza::El PR toca ${humanas.length} ruta(s) solo humanas sin la etiqueta ${ETIQUETA}`);
process.exit(1);
