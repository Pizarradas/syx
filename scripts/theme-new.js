#!/usr/bin/env node
/**
 * SYX — Un tema nuevo, de una vez
 * ───────────────────────────────
 * Crea un tema desde scss/themes/_template/, regenera todo lo que se deriva
 * de los temas y pasa los guardianes de temas, en un solo comando.
 *
 * POR QUÉ EXISTE
 * Medido en octubre de 2026 al crear un tema de producto: copiar la carpeta a
 * mano y cambiar el nombre con un reemplazo de la palabra suelta estropeaba la
 * prosa de los comentarios; la plantilla no traía bundle-docs ni bundle-core,
 * así que `npm run build`, `npm pack` y la instalación desde git fallaban; y
 * nada decía qué ficheros derivados hay que regenerar, de modo que
 * `npm run check` se convertía en un bucle: check:tokens falla → build:css,
 * check:figma falla → export:figma, check:prepros falla → prepros.config…
 * Cada vuelta, los 40 guardianes de la cadena desde el principio.
 *
 * QUÉ HACE
 *   1. Valida el nombre: kebab-case y que no exista ya.
 *   2. Instancia la plantilla con scripts/lib/plantilla-tema.js —lo mismo que
 *      comprueba check:plantilla—: scss/themes/<nombre>/ (sus .scss, con el
 *      nombre en los identificadores y la prosa intacta) y
 *      scss/styles-theme-<nombre>.scss. Con --sitio, además activa la capa del
 *      sitio en su _setup.scss (solo para temas que pintan las páginas de SYX).
 *   3. Da de alta el punto de entrada en prepros.config, con la misma
 *      configuración que los demás temas (check:prepros lo exige).
 *   4. Regenera los derivados, en este orden:
 *        build:css         css/styles-theme-<nombre>.css, tokens.json y
 *                          contracts/resolved-tokens.json
 *        validate:report   contracts/token-contract.json, lint-contract.json,
 *                          token-usage-map.json, runtime-tokens.json y
 *                          validation-report.md
 *        export:figma      contracts/figma/<nombre>.figma.json
 *        build:dist        dist/ (no se commitea): lo que corre `prepare`
 *   5. Pasa los guardianes de temas y de esos derivados, TODOS aunque alguno
 *      falle, y al final dice cuáles fallaron.
 *
 * Lo que no hace: elegir los valores del tema. Eso es tuyo, en los ✎ de
 * _theme.scss; después, `npm run build:css` y `npm run check`.
 *
 * Uso: npm run theme:new -- <nombre> [--sitio]
 *      node scripts/theme-new.js <nombre> [--sitio]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const plantilla = require('./lib/plantilla-tema');

const ROOT = path.join(__dirname, '..');
const SCSS = path.join(ROOT, 'scss');
const args = process.argv.slice(2);
const sitio = args.includes('--sitio');
const nombre = args.find((a) => !a.startsWith('--'));
// El tema real con el que check:setups compara las clases de un tema con la
// capa del sitio (el mismo que usa check:plantilla).
const REFERENCIA = 'example-01';

const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

function npm(script, extra = []) {
  const argv = ['run', '--silent', script, ...(extra.length ? ['--', ...extra] : [])];
  // En Windows npm es npm.cmd y sin shell no se encuentra (ENOENT); con shell,
  // Node pide la orden en una sola cadena. Los argumentos son nombres de
  // script y el nombre del tema, ya validado en kebab-case.
  const r = process.platform === 'win32'
    ? spawnSync(['npm', ...argv].join(' '), { cwd: ROOT, stdio: 'inherit', shell: true })
    : spawnSync('npm', argv, { cwd: ROOT, stdio: 'inherit' });
  return r.status === 0;
}

// ─── 1 · El nombre ───────────────────────────────────────────────────────────

const motivo = plantilla.motivoNombreInvalido(nombre, SCSS);
if (motivo) {
  console.error(`❌ ${motivo}\n   Uso: npm run theme:new -- <nombre> [--sitio]   (p. ej. npm run theme:new -- mi-marca)`);
  process.exit(1);
}

// ─── 2 · Instanciar la plantilla ─────────────────────────────────────────────

console.log(`\n── TEMA NUEVO: ${nombre} ${'─'.repeat(Math.max(0, 50 - nombre.length))}\n`);
const escritos = plantilla.instanciar({
  scssDir: SCSS,
  nombre,
  transformar: (s, f) => (sitio && f === '_setup.scss' ? plantilla.activarCapaSitio(s, nombre) : s),
});
for (const f of escritos) console.log(`   creado   ${rel(f)}`);
if (sitio) console.log('   con la capa del sitio activada en su _setup.scss');

// ─── 3 · prepros.config ──────────────────────────────────────────────────────
// Se reescribe con JSON.stringify a dos espacios, que es su formato (Prepros
// lo escribe así), conservando el fin de línea del fichero.

const PREPROS = path.join(ROOT, 'prepros.config');
const crudo = fs.readFileSync(PREPROS, 'utf8');
const cfg = JSON.parse(crudo);
const ficheros = cfg.config.files || (cfg.config.files = []);
const nueva = `scss/styles-theme-${nombre}.scss`;
const temasEnPrepros = ficheros.filter((f) => /^scss\/styles-theme-.+\.scss$/.test(f.file));
if (!temasEnPrepros.length) {
  console.error('❌ prepros.config no tiene ningún scss/styles-theme-*.scss que copiar');
  process.exit(1);
}
// La configuración que más temas comparten (no todas las entradas son
// idénticas: Prepros omite a veces una tarea que hereda del tipo).
const veces = new Map();
for (const f of temasEnPrepros) { const k = JSON.stringify(f.config || {}); veces.set(k, (veces.get(k) || 0) + 1); }
const config = JSON.parse([...veces].sort((a, b) => b[1] - a[1])[0][0]);
// En orden alfabético entre los puntos de entrada de tema.
const siguiente = temasEnPrepros.find((f) => f.file > nueva);
const en = siguiente ? ficheros.indexOf(siguiente) : ficheros.indexOf(temasEnPrepros[temasEnPrepros.length - 1]) + 1;
ficheros.splice(en, 0, { file: nueva, config });
const eol = crudo.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync(PREPROS, (JSON.stringify(cfg, null, 2) + '\n').replace(/\n/g, eol));
console.log(`   añadido  ${nueva} a prepros.config`);

// ─── 4 · Derivados ───────────────────────────────────────────────────────────

const derivados = ['build:css', 'validate:report', 'export:figma', 'build:dist'];
for (const s of derivados) {
  console.log(`\n── npm run ${s}`);
  if (!npm(s)) {
    console.error(`\n❌ npm run ${s} falló: el tema está creado y los derivados, a medias.`
      + '\n   Corrige lo que dice arriba y repite desde ese paso. Para deshacerlo: borra'
      + `\n   scss/themes/${nombre}/, scss/styles-theme-${nombre}.scss y su entrada en prepros.config,`
      + '\n   y vuelve a ejecutar los pasos de arriba (o descarta sus cambios con git).');
    process.exit(1);
  }
}

// ─── 5 · Guardianes ──────────────────────────────────────────────────────────
// Los de temas, y los que comprueban que los derivados de arriba están al día.
// check:setups compara contra un tema real solo si el nuevo lleva la capa del
// sitio: sin ella tiene a propósito menos clases que los temas del sitio, y la
// comprobación útil es la de las fuentes a mano en sus bundles.

const guardianes = [
  ['check:themes'],
  ['check:modo-claro'],
  ['check:contraste'],
  ['check:setups', ['--temas', sitio ? `${REFERENCIA},${nombre}` : nombre]],
  ['check:consumidores'],
  ['check:compilado'],
  ['check:tokens'],
  ['check:tokens-json'],
  ['check:figma'],
  ['check:prepros'],
];
const fallidos = [];
for (const [s, extra = []] of guardianes) {
  const etiqueta = [s, ...extra].join(' ');
  console.log(`\n── npm run ${etiqueta}`);
  if (!npm(s, extra)) fallidos.push(etiqueta);
}

console.log(`\n── RESUMEN ${'─'.repeat(55)}\n`);
console.log(`   ${nombre}: ${escritos.length} fichero(s) creados · prepros.config · ${derivados.length} derivados regenerados`);
console.log(`   ${guardianes.length - fallidos.length}/${guardianes.length} guardianes en verde`);
if (fallidos.length) {
  for (const f of fallidos) console.log(`   ❌ ${f}`);
  console.log('');
  process.exit(1);
}
console.log(`\n   Siguiente: cambia los valores marcados con ✎ en scss/themes/${nombre}/_theme.scss,`);
console.log('   y después npm run build:css && npm run check.\n');
