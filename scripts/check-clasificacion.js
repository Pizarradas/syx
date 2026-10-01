#!/usr/bin/env node
/**
 * SYX — Pruebas de la clasificación de confianza
 * ──────────────────────────────────────────────
 * `scripts/lib/confianza.js` decide qué puede escribir un agente. Lo consultan
 * propose.js, la herramienta MCP classify_change, el guardián de la CI
 * (check-confianza.js) y el hook de Claude Code. Si se equivoca, se equivocan
 * todos a la vez y ninguno lo nota, porque todos le preguntan a él.
 *
 * POR QUÉ EXISTE
 * La auditoría de octubre de 2026 midió que la misma ruta escrita de otra forma
 * cambiaba de nivel: `scss/atoms/../themes/_x.scss` salía `pr` siendo un tema,
 * `contracts/dtcg/../rules.json` salía `auto` siendo las reglas, y las rutas
 * absolutas caían al `default` por casualidad. Ninguna prueba lo miraba porque
 * todas pasaban la ruta bien escrita. Aquí se pasa mal escrita a propósito.
 *
 * QUÉ COMPRUEBA
 *   1. Normalización: `.`/`..`, barras invertidas, absolutas dentro y fuera
 *      del repositorio, mayúsculas.
 *   2. Invariantes del contrato: lo que juzga o instruye a un agente es
 *      `human`. Si alguien lo baja en trust.json, esto lo dice con nombre.
 *
 * Es rápido y no toca git: va en la cadena `npm run check`.
 *
 * Uso: node scripts/check-clasificacion.js   ·   npm run check:clasificacion
 */

'use strict';

const path = require('path');
const { clasificarRuta, normalizarRuta } = require('./lib/confianza');

const ROOT = path.join(__dirname, '..');

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });

/** Cada par [ruta, nivel esperado]; los fallos se juntan para verlos todos. */
function niveles(pares) {
  const malos = [];
  for (const [ruta, esperado] of pares) {
    const c = clasificarRuta(ruta);
    if (c.tier !== esperado) malos.push(`${ruta} → ${c.tier} (${c.patron || 'por defecto'}), esperaba ${esperado}`);
  }
  if (malos.length) throw new Error(malos.join('\n     '));
}

console.log('\n── CLASIFICACIÓN DE CONFIANZA ──────────────────────────────────\n');

// ─── 1. Normalización ────────────────────────────────────────────────────────

comprobar('los `..` se resuelven antes de comparar', () => niveles([
  ['scss/atoms/../themes/_x.scss', 'human'],
  ['./scss/atoms/../../scripts/propose.js', 'human'],
  ['contracts/dtcg/../rules.json', 'human'],
  ['scss/themes/../atoms/_button.scss', 'pr'],
  ['./scss/atoms/./_button.scss', 'pr'],
]));

comprobar('la ruta que devuelve es la canónica', () => {
  const pares = [
    ['./scss/atoms/../../scripts/propose.js', 'scripts/propose.js'],
    ['scss\\atoms\\_button.scss', 'scss/atoms/_button.scss'],
    ['scss//atoms/_button.scss', 'scss/atoms/_button.scss'],
    ['scss/atoms/', 'scss/atoms/'],
  ];
  for (const [entrada, canonica] of pares) {
    const r = normalizarRuta(entrada);
    if (r.rel !== canonica || r.fuera) throw new Error(`${entrada} → ${JSON.stringify(r)}, esperaba ${canonica}`);
  }
});

comprobar('una absoluta dentro del repositorio se clasifica como su relativa', () => niveles([
  [path.join(ROOT, 'scripts', 'propose.js'), 'human'],
  [path.join(ROOT, 'scss', 'atoms', '_button.scss'), 'pr'],
  [path.join(ROOT, 'docs', 'nota.md'), 'auto'],
]));

comprobar('una ruta que sale del repositorio se marca fuera, y nunca es auto ni pr', () => {
  for (const ruta of ['../otro/scss/atoms/_x.scss', 'scss/../../x.md', '/etc/passwd', path.join(ROOT, '..', 'x.md')]) {
    const c = clasificarRuta(ruta);
    if (!c.fuera) throw new Error(`${ruta} no se marcó fuera del repositorio (${c.path})`);
    if (c.tier !== 'human') throw new Error(`${ruta} salió ${c.tier}`);
  }
});

comprobar('las mayúsculas no cambian el nivel (macOS y Windows no las distinguen)', () => niveles([
  ['Contracts/Rules.json', 'human'],
  ['claude.md', 'human'],
  ['Scripts/propose.js', 'human'],
  ['SCSS/ATOMS/_button.scss', 'pr'],
]));

comprobar('la raíz del repositorio no es un fichero que se pueda escribir', () => niveles([
  ['.', 'human'],
  ['./', 'human'],
]));

// ─── 2. Invariantes del contrato ─────────────────────────────────────────────
// No son una copia de trust.json: son lo que trust.json no puede dejar de
// decir. Si una línea de aquí falla, o el contrato se ha relajado por error, o
// alguien ha decidido relajarlo y tiene que venir a decirlo también aquí.

comprobar('lo que instruye o juzga a un agente es solo humano', () => niveles([
  ['CLAUDE.md', 'human'],
  ['AGENTS.md', 'human'],
  ['AI_GUIDELINES.md', 'human'],
  ['.claude/commands/syx.md', 'human'],
  ['.claude/settings.json', 'human'],
  ['mind-system/routing.md', 'human'],
  ['_agents/modes/ui.md', 'human'],
  ['_agents/modes/README.md', 'human'],
  ['_agents/evals/tareas.json', 'human'],
  ['_agents/evals/referencias/audit-01.md', 'human'],
  ['_agents/decision-record.md', 'human'],
  ['contracts/trust.json', 'human'],
  ['contracts/rules.json', 'human'],
  ['scripts/hook-confianza.js', 'human'],
  ['.github/CODEOWNERS', 'human'],
]));

comprobar('el resto de _agents/ se propone, y su mapa se escribe directo', () => niveles([
  ['_agents/workflows/create-component.md', 'pr'],
  ['_agents/prompts/new-atom.md', 'pr'],
  ['_agents/architecture.md', 'auto'],
  ['_agents/architecture.json', 'auto'],
]));

comprobar('el markdown corriente sigue siendo automático', () => niveles([
  ['README.md', 'auto'],
  ['CHANGELOG.md', 'auto'],
  ['docs/decisions/ACOPLE.md', 'auto'],
  ['mind-system/knowledges/index.md', 'auto'],
  ['contracts/propuestas/component-x.md', 'auto'],
]));

comprobar('el CSS compilado es derivado, no humano por omisión', () => niveles([
  ['css/styles-theme-syx-sketch.css', 'auto'],
]));

// ─── Resultado ───────────────────────────────────────────────────────────────

(async () => {
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
