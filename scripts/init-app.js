#!/usr/bin/env node
/**
 * SYX — Preparar una aplicación para que cualquier agente respete SYX
 * ────────────────────────────────────────────────────────────────────
 * `npx syx-init` en la raíz de una app que instala SYX.
 *
 * POR QUÉ
 * AGENTS.md, AI_GUIDELINES.md y CONSUMING.md viajan con el paquete, pero
 * dentro de node_modules/: ningún agente los abre por su cuenta. Lo que lee
 * cada herramienta es el fichero de instrucciones de la RAÍZ del proyecto en
 * el que trabaja —AGENTS.md (la convención abierta), GEMINI.md, CLAUDE.md,
 * .github/copilot-instructions.md— y ahí no había nada de SYX. Sin contrato a
 * la vista, el modelo rellena el hueco con nombres verosímiles: `syx-atm-btn`,
 * `--syx-sem-*`, `atom-btn--sm`. Esto pone el contrato donde mira cada uno.
 *
 * QUÉ ESCRIBE
 *   AGENTS.md                         el contrato corto (templates/app/AGENTS.md)
 *   GEMINI.md · CLAUDE.md             un puntero que importa AGENTS.md
 *   .github/copilot-instructions.md   copia del bloque (Copilot no importa ficheros)
 *   SYX-VOCABULARY.md                 el vocabulario cerrado de la versión instalada:
 *                                     componentes (bloque, modificadores, elementos,
 *                                     estados), utilidades y tokens semánticos.
 *                                     Para el modelo que no puede ejecutar nada.
 *
 * LO QUE NO TOCA
 * En un fichero que ya existe solo reescribe lo que hay entre
 * `<!-- syx:start` y `<!-- syx:end -->`; si no hay marcas, añade el bloque al
 * final. SYX-VOCABULARY.md es entero de SYX y se regenera siempre.
 *
 * Uso:
 *   npx syx-init                    prefijo = nombre del package.json (o app-)
 *   npx syx-init --prefix shop      prefijo propio
 *   npx syx-init --update           tras actualizar SYX (conserva el prefijo)
 *   npx syx-init --dir ruta/app     otra raíz
 *   npx syx-init --dry-run          enseña lo que haría
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PKG = path.join(__dirname, '..');
const VERSION = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).version;

const arg = (n, d = null) => {
  const i = process.argv.indexOf(n);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const flag = (n) => process.argv.includes(n);

const DIR = path.resolve(arg('--dir', process.cwd()));
const SECO = flag('--dry-run');
const INICIO = /<!--\s*syx:start[\s\S]*?-->/;
const FIN = /<!--\s*syx:end\s*-->/;

// ─── El prefijo ──────────────────────────────────────────────────────────────
// Uno por proyecto, y con su nombre: `umbra-masthead` dice de dónde sale, y si
// mañana aparece un `motoro-masthead` casi igual, es candidato a organismo de
// SYX. Un `app-` genérico en todos los proyectos borraba esa pista.
//   1. --prefix, si se da;
//   2. el que ya figura en el bloque de AGENTS.md (--update no lo cambia en
//      silencio: el contrato diría una cosa y el código otra);
//   3. el nombre del package.json de la app, sin ámbito ni guiones;
//   4. `app`, si no hay nada de lo anterior o no vale.
const RESERVADOS = ['atom', 'mol', 'org', 'syx', 'layout', 'is', 'js', 'semantic', 'component', 'primitive', 'theme', 'reset', 'icon', 'page', 'tpl'];
const valido = (p) => /^[a-z][a-z0-9]*$/.test(p) && !RESERVADOS.includes(p);
function prefijoPrevio() {
  const f = path.join(DIR, 'AGENTS.md');
  if (!fs.existsSync(f)) return null;
  const m = /\*\*(?:App|Project) prefix: `([a-z][a-z0-9]*)`\*\*/.exec(fs.readFileSync(f, 'utf8'));
  return m ? m[1] : null;
}
function prefijoDelPaquete() {
  try {
    const nombre = JSON.parse(fs.readFileSync(path.join(DIR, 'package.json'), 'utf8')).name || '';
    const p = nombre.replace(/^@[^/]+\//, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return valido(p) && p.length <= 16 ? p : null;
  } catch (e) { return null; }
}
const PREFIJO = arg('--prefix') || prefijoPrevio() || prefijoDelPaquete() || 'app';
if (!valido(PREFIJO)) {
  console.error(`\n   El prefijo «${PREFIJO}» no vale: una palabra en minúsculas y que no sea de SYX (${RESERVADOS.join(', ')}).\n`);
  process.exit(1);
}

const plantilla = (nombre) =>
  fs.readFileSync(path.join(PKG, 'templates', 'app', nombre), 'utf8')
    .replace(/\{\{prefix\}\}/g, PREFIJO)
    .replace(/\{\{version\}\}/g, VERSION)
    .trim();

// ─── Escribir respetando lo ajeno ────────────────────────────────────────────
const hechos = [];
function encajar(relativo, bloque) {
  const f = path.join(DIR, relativo);
  let previo = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
  let nuevo;
  let como;
  if (previo === null) { nuevo = bloque + '\n'; como = 'creado'; }
  else if (INICIO.test(previo) && FIN.test(previo)) {
    const a = previo.search(INICIO);
    const finM = FIN.exec(previo);
    const b = finM.index + finM[0].length;
    nuevo = previo.slice(0, a) + bloque + previo.slice(b);
    como = nuevo === previo ? 'sin cambios' : 'bloque SYX actualizado';
  } else {
    nuevo = previo.replace(/\s*$/, '') + '\n\n' + bloque + '\n';
    como = 'bloque SYX añadido al final';
  }
  hechos.push([relativo, como]);
  if (!SECO && nuevo !== previo) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, nuevo);
  }
}

// ─── El vocabulario ──────────────────────────────────────────────────────────
// Lo que existe de verdad en la versión instalada: el registro (contrastado
// contra el CSS compilado al generarse) para los componentes, el CSS para las
// utilidades y tokens.json para los tokens.

/** `a-x`, `a-y`, `a-z` → `a-{x,y,z}`. Agrupa por lo que va antes del último guion. */
function agrupar(nombres) {
  const grupos = new Map();
  for (const n of [...nombres].sort()) {
    const i = n.lastIndexOf('-');
    const raiz = i > 0 ? n.slice(0, i + 1) : n;
    if (!grupos.has(raiz)) grupos.set(raiz, []);
    grupos.get(raiz).push(i > 0 ? n.slice(i + 1) : '');
  }
  const fuera = [];
  for (const [raiz, colas] of grupos) {
    if (colas.length === 1) fuera.push(raiz + colas[0]);
    else fuera.push(`${raiz}{${colas.join(',')}}`);
  }
  return fuera;
}

/** Modificadores: exactos salvo familias largas (`atom-icon--lc-*`), que se agrupan. */
function modificadores(lista, bloque) {
  const familias = new Map();
  const sueltos = [];
  for (const m of lista) {
    const cola = m.slice(bloque.length + 2);
    const k = cola.includes('-') ? cola.split('-')[0] : null;
    if (k) { if (!familias.has(k)) familias.set(k, []); familias.get(k).push(cola.slice(k.length + 1)); }
    else sueltos.push(m);
  }
  const fuera = [...sueltos];
  for (const [k, colas] of familias) {
    if (colas.length > 8) fuera.push(`${bloque}--${k}-{${colas.sort().join(',')}}`);
    else for (const c of colas) fuera.push(`${bloque}--${k}-${c}`);
  }
  return fuera.sort();
}

function cssDelSistema() {
  const dist = path.join(PKG, 'dist');
  const candidatos = [
    path.join(dist, 'syx.utilities.min.css'),
    ...(fs.existsSync(path.join(PKG, 'css')) ? fs.readdirSync(path.join(PKG, 'css')).filter((n) => /^styles-theme-.*\.css$/.test(n)).map((n) => path.join(PKG, 'css', n)) : []),
  ].filter((f) => fs.existsSync(f));
  return candidatos.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
}

function vocabulario() {
  const reg = JSON.parse(fs.readFileSync(path.join(PKG, 'component-registry.json'), 'utf8'));
  const tok = JSON.parse(fs.readFileSync(path.join(PKG, 'tokens.json'), 'utf8'));
  const css = cssDelSistema();
  const clases = new Set([...css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]));
  const temas = fs.existsSync(path.join(PKG, 'dist'))
    ? fs.readdirSync(path.join(PKG, 'dist')).filter((n) => n.endsWith('.full.min.css')).map((n) => n.replace('.full.min.css', ''))
    : [];

  const L = [];
  L.push('<!-- Generated by `npx syx-init` — do not edit. `npx syx-init --update` regenerates it. -->');
  L.push(`# SYX vocabulary — v${VERSION}`);
  L.push('');
  L.push('The complete list of class and token names SYX declares in the installed version.');
  L.push('**A SYX name that is not on this page does not exist** — it compiles, and paints nothing.');
  L.push('Copy names exactly. `a-{x,y}` is shorthand for `a-x` and `a-y`.');
  L.push(`Rules for using them: \`AGENTS.md\` (section *UI*) and \`node_modules/syx-design-system/CONSUMING.md\`.`);
  L.push('');
  if (temas.length) {
    L.push(`**Themes** (import one: \`import 'syx-design-system/themes/<name>.css'\`): ${temas.map((t) => `\`${t}\``).join(', ')}`);
    L.push('');
  }
  L.push('**Layers**, in order: `syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.app, syx.utilities`. App rules go in `syx.app`.');
  L.push('');

  const capas = [['atoms', 'Atoms', 'atom-'], ['molecules', 'Molecules', 'mol-'], ['organisms', 'Organisms', 'org-']];
  for (const [k, titulo, pre] of capas) {
    L.push(`## ${titulo} (\`${pre}*\`)`);
    L.push('');
    for (const c of reg[k]) {
      for (const bloque of c.classes) {
        L.push(`### \`${bloque}\``);
        if (c.description) L.push(c.description.replace(/\s+/g, ' ').trim());
        const mods = (c.modifiers || []).filter((m) => m.startsWith(bloque + '--'));
        if (mods.length) L.push(`- modifiers: ${modificadores(mods, bloque).map((m) => `\`${m}\``).join(' ')}`);
        const els = (c.elements || []).filter((e) => e.startsWith(bloque + '__'));
        if (els.length) L.push(`- elements: ${els.map((e) => `\`${e}\``).join(' ')}`);
        if ((c.states || []).length) L.push(`- states: ${c.states.map((s) => `\`${s}\``).join(' ')}`);
        if ((c.composedOf || []).length) L.push(`- composed of: ${c.composedOf.map((s) => `\`${s}\``).join(' ')}`);
        if (c.a11y) L.push(`- a11y: ${c.a11y.replace(/\s+/g, ' ').trim()}`);
        if (c.usage) L.push('- usage:', '', '```html', c.usage.trim(), '```');
        L.push('');
      }
    }
  }

  L.push('## Utilities (`syx-*`) and layout (`layout-*`)');
  L.push('');
  L.push('Utilities live in the last layer: they win over component and app styles. One property each.');
  L.push('');
  const utiles = [...clases].filter((c) => /^syx-/.test(c) && !/^syx--theme/.test(c));
  const familias = new Map();
  for (const u of utiles) {
    const k = u.split('-').slice(0, 2).join('-');
    if (!familias.has(k)) familias.set(k, []);
    familias.get(k).push(u);
  }
  for (const [, lista] of [...familias].sort()) L.push(`- ${agrupar(lista).map((x) => `\`${x}\``).join(' ')}`);
  const layout = [...clases].filter((c) => /^layout-/.test(c)).sort();
  if (layout.length) L.push(`- ${agrupar(layout).map((x) => `\`${x}\``).join(' ')}`);
  L.push('');

  L.push('## Tokens your app may read');
  L.push('');
  L.push('Read these in `--' + PREFIJO + '-*` token declarations. Never read `--primitive-*` or `--component-*` from app code,');
  L.push('and never declare a new name under these prefixes: your tokens are `--' + PREFIJO + '-*`.');
  L.push('');
  for (const capa of ['semantic', 'theme', 'layout']) {
    const nombres = Object.entries(tok[capa] || {})
      .filter(([, v]) => !['deprecated', 'reserved'].includes(v.status))
      .map(([n]) => n);
    if (!nombres.length) continue;
    L.push(`### \`--${capa}-*\``);
    const porFamilia = new Map();
    for (const n of nombres) {
      const k = n.split('-').slice(0, 5).join('-');
      if (!porFamilia.has(k)) porFamilia.set(k, []);
      porFamilia.get(k).push(n);
    }
    for (const [, lista] of [...porFamilia].sort()) L.push(`- ${agrupar(lista).map((x) => `\`${x}\``).join(' ')}`);
    L.push('');
  }
  return L.join('\n');
}

// ─── Hacerlo ─────────────────────────────────────────────────────────────────
if (!fs.existsSync(DIR)) { console.error(`\n   No existe ${DIR}\n`); process.exit(1); }

const bloqueAgents = plantilla('AGENTS.md');
encajar('AGENTS.md', bloqueAgents);
encajar('GEMINI.md', plantilla('GEMINI.md'));
encajar('CLAUDE.md', plantilla('CLAUDE.md'));
encajar(path.join('.github', 'copilot-instructions.md'), bloqueAgents);

const vocab = path.join(DIR, 'SYX-VOCABULARY.md');
const texto = vocabulario() + '\n';
const antes = fs.existsSync(vocab) ? fs.readFileSync(vocab, 'utf8') : null;
hechos.push(['SYX-VOCABULARY.md', antes === null ? 'creado' : antes === texto ? 'sin cambios' : 'regenerado']);
if (!SECO && antes !== texto) fs.writeFileSync(vocab, texto);

console.log(`\n── SYX ${VERSION} · contrato para agentes ${SECO ? '(simulación) ' : ''}` + '─'.repeat(20) + '\n');
console.log(`   raíz       ${DIR}`);
console.log(`   prefijo    ${PREFIJO}-*  ·  --${PREFIJO}-*\n`);
for (const [f, como] of hechos) console.log(`   ${como === 'sin cambios' ? '·' : '✓'} ${f.padEnd(34)} ${como}`);
console.log(`
   Siguiente:
   1. Primera línea de cada hoja de estilos de la app (en SCSS, tras los @use):
      @layer syx.reset, syx.base, syx.tokens, syx.atoms, syx.molecules, syx.organisms, syx.app, syx.utilities;
   2. Antes de dar algo por bueno:  npx syx-scan src   (en CI: --fallar-si-media)
   3. Opcional, MCP en cualquier cliente:  { "mcpServers": { "syx": { "command": "npx", "args": ["-y", "syx-mcp"] } } }
   4. Asistente sin acceso a ficheros: pega AGENTS.md y SYX-VOCABULARY.md en sus instrucciones.
`);
