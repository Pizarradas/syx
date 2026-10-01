#!/usr/bin/env node
/**
 * SYX — Toda declaración de un tema tiene quien la lea
 * ────────────────────────────────────────────────────
 * Un tema que declara `--btn-primary-filled-text: …` cree que está ajustando
 * el texto del botón. Si el botón lee otro token, la línea no hace nada y nadie
 * se entera: no falla la compilación, no avisa ningún guardián, el contraste
 * sigue igual de mal. Así estaba example-06 en octubre de 2026, y no era un
 * caso suelto: entre el 30 y el 40 % de las declaraciones de cada tema no las
 * leía nadie (example-01 76 de 210, syx-sketch 105 de 564), casi todas alias
 * heredados (--btn-*, --check-*, --switch-*, --form-*, --pagination-*…) que
 * los temas copiaban de la plantilla y que ningún componente leía ya.
 *
 * Qué cuenta como lector, y la única excepción (los --semantic-* que declara
 * el árbol común, que son API pública para las aplicaciones), está explicado
 * en scripts/lib/consumo-tema.js, que es donde se mide.
 *
 * Mira:
 *   · cada tema compilado (scss/themes/<tema>/ contra css/styles-theme-<tema>.css)
 *   · lo compartido por todos (scss/themes/_base/, _shared/): vale con que lo
 *     lea UN tema.
 * La plantilla (_template) no se compila aquí: la revisa check:plantilla, que
 * la instancia como un tema más en una copia del árbol.
 *
 * Uso: node scripts/check-consumidores.js [--json]   ·   npm run check:consumidores
 * (Auditoría 2026-10 · acción 14)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { revisarTema, vivosEn, lectoresExternos, semanticosComunes } = require('./lib/consumo-tema');
const { leerDeclaraciones } = require('./lib/scss-tokens');

const ROOT = process.env.SYX_RAIZ ? path.resolve(process.env.SYX_RAIZ) : path.join(__dirname, '..');
const TEMAS_DIR = path.join(ROOT, 'scss', 'themes');
const CSS_DIR = path.join(ROOT, 'css');
const json = process.argv.includes('--json');

const externos = lectoresExternos(ROOT);
const api = semanticosComunes(ROOT);
const temas = fs.readdirSync(TEMAS_DIR)
  .filter((d) => !d.startsWith('_') && fs.existsSync(path.join(CSS_DIR, `styles-theme-${d}.css`)))
  .sort();

const informe = { temas: {}, compartido: [] };
let fallos = 0;
const cssDe = {};

for (const t of temas) {
  cssDe[t] = fs.readFileSync(path.join(CSS_DIR, `styles-theme-${t}.css`), 'utf8');
  const r = revisarTema({ root: ROOT, dirTema: path.join(TEMAS_DIR, t), css: cssDe[t], externos, api });
  informe.temas[t] = r;
  fallos += r.sinConsumidor.length;
}

// Lo compartido: vivo si lo lee algún tema (o lo leen las páginas).
const vivosAlguno = new Set();
for (const t of temas) for (const x of vivosEn(cssDe[t], new Set([...externos, ...api]))) vivosAlguno.add(x);
for (const sub of ['_base', '_shared']) {
  const dir = path.join(TEMAS_DIR, sub);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.scss'))) {
    const rel = path.relative(ROOT, path.join(dir, f)).split(path.sep).join('/');
    const vistas = new Set();
    for (const d of leerDeclaraciones(fs.readFileSync(path.join(dir, f), 'utf8'))) {
      if (vivosAlguno.has(d.name) || vistas.has(d.name)) continue;
      vistas.add(d.name);
      informe.compartido.push({ token: d.name, file: rel, line: d.line });
      fallos++;
    }
  }
}

if (json) {
  console.log(JSON.stringify(informe, null, 2));
  process.exit(fallos ? 1 : 0);
}

console.log('\n── DECLARACIONES DE TEMA SIN CONSUMIDOR ─────────────────────────\n');
for (const [t, r] of Object.entries(informe.temas)) {
  const exentas = r.exentas.length ? ` · ${r.exentas.length} rol(es) semántico(s) de la API sin lector en el sistema` : '';
  if (!r.sinConsumidor.length) {
    console.log(`✅ ${t.padEnd(12)} ${r.declaradas} declaraciones, todas con lector${exentas}`);
    continue;
  }
  console.log(`❌ ${t.padEnd(12)} ${r.sinConsumidor.length} de ${r.declaradas} sin lector${exentas}`);
  for (const x of r.sinConsumidor.slice(0, 12)) console.log(`     ${x.token}  ${x.file}:${x.line}`);
  if (r.sinConsumidor.length > 12) console.log(`     … y ${r.sinConsumidor.length - 12} más (--json para la lista)`);
}
if (informe.compartido.length) {
  console.log(`❌ compartido  ${informe.compartido.length} sin lector en ningún tema`);
  for (const x of informe.compartido) console.log(`     ${x.token}  ${x.file}:${x.line}`);
} else {
  console.log('✅ compartido  _base/ y _shared/: todo lo lee algún tema');
}
if (fallos) {
  console.log('\n   Una declaración que nadie lee no hace nada. Si el tema quería cambiar');
  console.log('   algo, busca el token que de verdad lee el componente (tokens.json, o');
  console.log('   `get_component` en el servidor MCP) y declara ese; si no, bórrala.');
}
console.log(`\n   ${temas.length} temas · ${fallos} declaración(es) sin consumidor\n`);
process.exit(fallos ? 1 : 0);
