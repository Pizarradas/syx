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
 *   3. El hook de Claude Code (scripts/hook-confianza.js): bloquea `human`,
 *      avisa en `pr`, calla en `auto`, y .claude/settings.json lo registra.
 *
 * Es rápido y no toca git: va en la cadena `npm run check`.
 *
 * Uso: node scripts/check-clasificacion.js   ·   npm run check:clasificacion
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
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

// ─── 3. El hook de Claude Code ───────────────────────────────────────────────

const HOOK = path.join(__dirname, 'hook-confianza.js');
/** Ejecuta el hook como lo haría Claude Code: el JSON de la llamada por stdin. */
function hook(entrada, env = {}) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: typeof entrada === 'string' ? entrada : JSON.stringify(entrada),
    encoding: 'utf8',
    env: { ...process.env, SYX_HOOK_HUMANO: '', ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const llamada = (herramienta, ruta) => ({
  hook_event_name: 'PreToolUse', tool_name: herramienta, cwd: ROOT, tool_input: { file_path: ruta },
});

comprobar('el hook bloquea una escritura en una ruta solo humana, y dice por qué', () => {
  for (const [h, r] of [['Edit', path.join(ROOT, 'scripts', 'propose.js')], ['Write', 'CLAUDE.md'], ['MultiEdit', 'scss/atoms/../themes/x/_theme.scss']]) {
    const x = hook(llamada(h, r));
    if (x.code !== 2) throw new Error(`${h} ${r}: salió ${x.code}, esperaba 2 (bloqueo)`);
    if (!x.err.includes('Solo humano')) throw new Error(`${h} ${r}: el motivo no nombra el nivel: ${x.err}`);
  }
});

comprobar('el hook avisa en pr sin bloquear, y nombra propose.js', () => {
  const x = hook(llamada('Edit', path.join(ROOT, 'scss', 'atoms', '_pill.scss')));
  if (x.code !== 0) throw new Error(`salió ${x.code}: bloquea lo que solo debía avisar`);
  const j = JSON.parse(x.out);
  if (j.hookSpecificOutput?.permissionDecision) throw new Error('toma una decisión de permiso en vez de solo avisar');
  if (!/propose\.js files/.test(j.hookSpecificOutput?.additionalContext || '')) throw new Error('el aviso no le llega a Claude o no nombra propose.js files');
});

comprobar('el hook calla en auto y fuera del repositorio', () => {
  for (const r of [path.join(ROOT, 'docs', 'nota.md'), '/tmp/fuera-de-syx.md']) {
    const x = hook(llamada('Write', r));
    if (x.code !== 0 || x.out.trim()) throw new Error(`${r}: salió ${x.code} con «${x.out.trim()}»`);
  }
});

comprobar('el hook bloquea si no puede leer la llamada', () => {
  const x = hook('esto no es JSON');
  if (x.code !== 2) throw new Error(`salió ${x.code}: dejaría pasar una llamada que no entiende`);
});

comprobar('.claude/settings.json registra el hook para las herramientas de edición', () => {
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
  const entradas = s.hooks?.PreToolUse || [];
  const e = entradas.find((x) => (x.hooks || []).some((h) => /scripts\/hook-confianza\.js/.test(h.command || '')));
  if (!e) throw new Error('ningún PreToolUse ejecuta scripts/hook-confianza.js');
  const cubre = new Set(String(e.matcher).split(/[|,\s]+/));
  const faltan = ['Edit', 'Write', 'MultiEdit'].filter((t) => !cubre.has(t));
  if (faltan.length) throw new Error(`el matcher «${e.matcher}» no cubre ${faltan.join(', ')}`);
});

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
