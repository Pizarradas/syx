#!/usr/bin/env node
/**
 * SYX — Prueba de `syx-init`
 * ──────────────────────────
 * Lo que `npx syx-init` deja en una app es lo que un agente va a tomar por
 * verdad. Si el vocabulario lista una clase que no existe, el agente la usará
 * con la conciencia tranquila; si el bloque pisa lo que la app ya tenía en su
 * AGENTS.md, nadie volverá a ejecutarlo. Se prueban las dos cosas.
 *
 *   1. Crea los cinco ficheros en una app vacía.
 *   2. En un AGENTS.md ajeno añade el bloque al final sin tocar lo anterior.
 *   3. Es idempotente: la segunda pasada no cambia nada.
 *   4. --update conserva el prefijo elegido; un prefijo de SYX se rechaza.
 *   5. Todo nombre del vocabulario existe: cada clase (con las llaves
 *      expandidas) en el CSS compilado y cada token en tokens.json.
 *
 * Uso: node scripts/check-init-app.js   ·   npm run check:init-app
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const INIT = path.join(__dirname, 'init-app.js');
const correr = (args) => execFileSync(process.execPath, [INIT, ...args], { encoding: 'utf8' });

const resultados = [];
function comprobar(nombre, fn) {
  try { resultados.push({ nombre, ok: true, detalle: fn() }); }
  catch (e) { resultados.push({ nombre, ok: false, detalle: e.message }); }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-init-'));
const vacia = path.join(tmp, 'vacia');
const ajena = path.join(tmp, 'ajena');
fs.mkdirSync(vacia); fs.mkdirSync(ajena);
const PREVIO = '# Mi app\n\nNotas que no son de SYX.\n';
fs.writeFileSync(path.join(ajena, 'AGENTS.md'), PREVIO);

const FICHEROS = ['AGENTS.md', 'GEMINI.md', 'CLAUDE.md', path.join('.github', 'copilot-instructions.md'), 'SYX-VOCABULARY.md'];

comprobar('crea los cinco ficheros en una app vacía', () => {
  correr(['--dir', vacia]);
  const faltan = FICHEROS.filter((f) => !fs.existsSync(path.join(vacia, f)));
  if (faltan.length) throw new Error(`faltan ${faltan.join(', ')}`);
  const agents = fs.readFileSync(path.join(vacia, 'AGENTS.md'), 'utf8');
  if (/\{\{/.test(agents)) throw new Error('quedan marcadores {{…}} sin sustituir');
  if (!agents.includes('**App prefix: `app`**')) throw new Error('el prefijo por defecto no es app');
  return FICHEROS.length + ' ficheros';
});

comprobar('respeta lo que la app ya tenía', () => {
  correr(['--dir', ajena, '--prefix', 'shop']);
  const t = fs.readFileSync(path.join(ajena, 'AGENTS.md'), 'utf8');
  if (!t.startsWith(PREVIO.trim())) throw new Error('el contenido previo de AGENTS.md ha cambiado');
  if ((t.match(/<!--\s*syx:start/g) || []).length !== 1) throw new Error('el bloque no aparece exactamente una vez');
  return 'contenido previo intacto, un bloque al final';
});

comprobar('es idempotente y --update conserva el prefijo', () => {
  const antes = FICHEROS.map((f) => fs.readFileSync(path.join(ajena, f), 'utf8'));
  correr(['--dir', ajena, '--update']);
  const despues = FICHEROS.map((f) => fs.readFileSync(path.join(ajena, f), 'utf8'));
  const cambiados = FICHEROS.filter((f, i) => antes[i] !== despues[i]);
  if (cambiados.length) throw new Error(`la segunda pasada cambió ${cambiados.join(', ')}`);
  if (!despues[0].includes('**App prefix: `shop`**')) throw new Error('--update perdió el prefijo shop');
  return 'sin cambios en la segunda pasada · prefijo shop conservado';
});

comprobar('rechaza un prefijo de SYX', () => {
  for (const p of ['syx', 'atom', 'mol', 'org', 'Shop', 'my-app']) {
    const r = spawnSync(process.execPath, [INIT, '--dir', vacia, '--prefix', p, '--dry-run'], { encoding: 'utf8' });
    if (r.status === 0) throw new Error(`aceptó --prefix ${p}`);
  }
  return '6 prefijos inválidos rechazados';
});

/** `a-{x,y}` → [`a-x`, `a-y`]. */
const expandir = (n) => {
  const m = /^(.*)\{([^}]*)\}(.*)$/.exec(n);
  return m ? m[2].split(',').flatMap((c) => expandir(m[1] + c + m[3])) : [n];
};

comprobar('todo nombre del vocabulario existe', () => {
  const vocab = fs.readFileSync(path.join(vacia, 'SYX-VOCABULARY.md'), 'utf8');
  const css = fs.readdirSync(path.join(ROOT, 'css')).filter((n) => n.endsWith('.css'))
    .map((n) => fs.readFileSync(path.join(ROOT, 'css', n), 'utf8')).join('\n');
  const clases = new Set([...css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]));
  const tj = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8'));
  const tokens = new Set(Object.entries(tj).filter(([k]) => k !== '_meta').flatMap(([, v]) => Object.keys(v)));
  // Solo lo citado como nombre (entre comillas invertidas), no el HTML de `usage`.
  // Ni la línea de temas (`syx-sketch` es un tema, no una clase).
  const sinCodigo = vocab.replace(/```[\s\S]*?```/g, '').replace(/^\*\*Themes\*\*.*$/m, '');
  // Una base sin estilos propios cuya familia sí existe (`.mol-tabs`, ancla
  // del JS de pestañas) es real: el escáner la acepta igual.
  const existe = (c) => clases.has(c) || [...clases].some((k) => k.startsWith(c + '__') || k.startsWith(c + '--'));
  const citados = [...sinCodigo.matchAll(/`([^`\s]+)`/g)].map((m) => m[1]).flatMap(expandir);
  const malos = [];
  let n = 0;
  for (const c of citados) {
    if (/^(atom|mol|org|syx|layout)-[\w-]+$/.test(c)) { n++; if (!existe(c)) malos.push('.' + c); }
    else if (/^--(semantic|theme|layout)-[\w-]+$/.test(c)) { n++; if (!tokens.has(c)) malos.push(c); }
  }
  if (malos.length) throw new Error(`${malos.length} nombres que no existen: ${malos.slice(0, 8).join(', ')}`);
  if (n < 300) throw new Error(`solo ${n} nombres: el vocabulario ha salido casi vacío`);
  return `${n} nombres, todos existen`;
});

fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n── SYX-INIT ' + '─'.repeat(52) + '\n');
for (const r of resultados) console.log(`${r.ok ? '✅' : '❌'} ${r.nombre}${r.detalle ? ' — ' + r.detalle : ''}`);
const fallos = resultados.filter((r) => !r.ok).length;
console.log(`\n   ${resultados.length - fallos}/${resultados.length} comprobaciones\n`);
process.exitCode = fallos ? 1 : 0;
