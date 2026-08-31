#!/usr/bin/env node
/**
 * SYX — Prueba de consumo real
 * ────────────────────────────
 * Empaqueta SYX, lo instala en un proyecto de usar y tirar FUERA del
 * repositorio, y desde allí lo usa como lo usaría cualquiera: importa un tema,
 * lee los tokens resueltos, llama a la API y arranca el servidor MCP por su
 * `bin`.
 *
 * POR QUÉ SEPARADO DE `check:package`
 * `check:package` lee el manifiesto y es instantáneo, así que va en la cadena
 * de `npm run check`. Esto empaqueta e instala 10 MB y tarda; ponerlo en la
 * cadena castigaría cada commit por un fallo que solo puede aparecer al tocar
 * `exports`, `files` o la estructura del paquete.
 *
 * POR QUÉ FUERA DEL REPOSITORIO
 * Porque el criterio de aceptación del paso 1.2 es literalmente «sin tocar el
 * repositorio de SYX». Probando desde dentro, Node encontraría los ficheros por
 * ruta relativa y todo pasaría aunque `exports` estuviera mal: la prueba se
 * respondería a sí misma.
 *
 * Uso: node scripts/check-consumible.js   ·   npm run check:consumible
 */

'use strict';

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });

console.log('\n── CONSUMO REAL DEL PAQUETE ────────────────────────────────────\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-consumidor-'));
let tarball;

try {
  const salida = execFileSync('npm', ['pack', '--pack-destination', tmp, '--json'], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  });
  tarball = path.join(tmp, JSON.parse(salida)[0].filename);
  console.log(`   empaquetado         ${path.basename(tarball)}`);

  fs.writeFileSync(
    path.join(tmp, 'package.json'),
    JSON.stringify({ name: 'consumidor-de-prueba', version: '1.0.0', private: true }, null, 2)
  );
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--silent', tarball], {
    cwd: tmp, stdio: ['ignore', 'ignore', 'pipe'],
  });
  console.log(`   instalado en        ${tmp}\n`);
} catch (e) {
  console.log(`❌ No se pudo empaquetar o instalar: ${e.message}\n`);
  process.exit(1);
}

// Todo lo que sigue corre con `cwd` en el proyecto de prueba y resuelve por
// nombre de paquete: si algo falta en `files` o en `exports`, falla aquí.
const enConsumidor = (codigo) =>
  execFileSync(process.execPath, ['-e', codigo], { cwd: tmp, encoding: 'utf8' }).trim();

comprobar('require del paquete por su nombre', () => {
  const v = enConsumidor(`console.log(require('${PKG.name}').version)`);
  if (v !== PKG.version) throw new Error(`versión ${v}, esperaba ${PKG.version}`);
});

comprobar('la API responde el valor de un token en claro y en oscuro', () => {
  const salida = enConsumidor(`
    const syx = require('${PKG.name}');
    const t = '--component-button-primary-filled-bg';
    const a = syx.getToken({ token: t });
    const b = syx.getToken({ token: t, theme: 'syx-sketch', mode: 'dark' });
    console.log(JSON.stringify({ a: a.value, b: b.value, cadena: (b.cadena || []).length }));
  `);
  const r = JSON.parse(salida);
  if (!r.a || !r.b) throw new Error('sin valor');
  if (r.a === r.b) throw new Error('claro y oscuro dan lo mismo');
  if (!r.cadena) throw new Error('sin cadena de alias: no viaja el CSS del tema');
});

comprobar('la hoja de un tema se importa por su ruta pública', () => {
  const salida = enConsumidor(`
    const fs = require('fs');
    const p = require.resolve('${PKG.name}/themes/syx-sketch.css');
    console.log(JSON.stringify({ p, bytes: fs.statSync(p).size, tiene: fs.readFileSync(p,'utf8').includes('@layer') }));
  `);
  const r = JSON.parse(salida);
  if (!r.tiene) throw new Error('la hoja no contiene @layer: no es la compilada');
  if (r.bytes < 100000) throw new Error(`la hoja pesa ${r.bytes} B: parece incompleta`);
});

comprobar('los siete temas y el SCSS fuente viajan', () => {
  const salida = enConsumidor(`
    const syx = require('${PKG.name}');
    const fs = require('fs');
    const temas = syx.listThemes().themes;
    const faltan = temas.filter((t) => !fs.existsSync(syx.cssPath(t)) || !fs.existsSync(syx.scssPath(t)));
    console.log(JSON.stringify({ n: temas.length, faltan }));
  `);
  const r = JSON.parse(salida);
  if (r.n !== 7) throw new Error(`${r.n} temas`);
  if (r.faltan.length) throw new Error(`sin hoja o sin fuente: ${r.faltan.join(', ')}`);
});

comprobar('los contratos se leen desde el paquete instalado', () => {
  const salida = enConsumidor(`
    const snap = require('${PKG.name}/contracts/resolved-tokens.json');
    const reglas = require('${PKG.name}/contracts/rules.json');
    console.log(JSON.stringify({ temas: snap._meta.themes.length, reglas: Object.keys(reglas.rules || reglas).length }));
  `);
  const r = JSON.parse(salida);
  if (r.temas !== 7) throw new Error(`el snapshot instalado trae ${r.temas} temas`);
  if (!r.reglas) throw new Error('rules.json vacío');
});

comprobar('el validador de fragmentos funciona instalado', () => {
  const salida = enConsumidor(`
    const syx = require('${PKG.name}');
    const malo = syx.validateSnippet({ code: '.x { color: var(--primitive-color-blue-500); }' });
    const bueno = syx.validateSnippet({ code: '.x { color: var(--semantic-color-primary); }' });
    console.log(JSON.stringify({ malo: malo.conforme, bueno: bueno.conforme }));
  `);
  const r = JSON.parse(salida);
  if (r.malo !== false || r.bueno !== true) throw new Error(`veredictos ${JSON.stringify(r)}`);
});

comprobar('el servidor MCP arranca desde el bin instalado', () => {
  const bin = path.join(tmp, 'node_modules', '.bin', Object.keys(PKG.bin)[0]);
  if (!fs.existsSync(bin)) throw new Error(`no se creó ${path.basename(bin)} en node_modules/.bin`);
  const servidor = path.join(tmp, 'node_modules', PKG.name, PKG.bin[Object.keys(PKG.bin)[0]]);
  const r = execFileSync(process.execPath, [servidor], {
    cwd: tmp,
    encoding: 'utf8',
    input:
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) + '\n' +
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_component', arguments: { name: 'btn' } } }) + '\n',
    timeout: 20000,
  });
  const lineas = r.trim().split('\n').map((l) => JSON.parse(l));
  if (lineas[0].result?.serverInfo?.name !== 'syx') throw new Error('initialize no responde');
  const comp = JSON.parse(lineas[1].result.content[0].text);
  if (!comp.encontrado || !comp.classes.includes('atom-btn')) throw new Error('get_component no responde bien');
});

comprobar('nada resuelve fuera del paquete instalado', () => {
  // Si alguna ruta escapase a node_modules, el paquete estaría leyendo del
  // repositorio y la prueba entera valdría cero.
  const salida = enConsumidor(`
    const syx = require('${PKG.name}');
    console.log(JSON.stringify({ root: syx.paths.root, css: syx.cssPath('example-03') }));
  `);
  const r = JSON.parse(salida);
  for (const [k, v] of Object.entries(r)) {
    if (!v.includes(`node_modules`)) throw new Error(`${k} apunta fuera de node_modules: ${v}`);
    if (v.startsWith(ROOT)) throw new Error(`${k} apunta al repositorio: ${v}`);
  }
});

(async () => {
  let fallos = 0;
  for (const c of casos) {
    try {
      await c.fn();
      console.log(`✅ ${c.nombre}`);
    } catch (e) {
      fallos++;
      console.log(`❌ ${c.nombre}\n     ${String(e.message).split('\n').slice(0, 4).join('\n     ')}`);
    }
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* da igual: es /tmp */ }
  console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
  process.exit(fallos ? 1 : 0);
})();
