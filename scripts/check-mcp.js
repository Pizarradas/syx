#!/usr/bin/env node
/**
 * SYX — Prueba de humo del servidor MCP
 * ─────────────────────────────────────
 * Lanza el servidor de verdad y habla con él por stdio, como haría un cliente.
 * No se prueban las funciones por dentro a propósito: lo que puede romperse en
 * un servidor MCP es el protocolo —un `initialize` que no responde, un esquema
 * mal formado, una herramienta que lanza en vez de devolver— y eso solo se ve
 * hablando con él.
 *
 * Uso: node scripts/check-mcp.js   ·   npm run check:mcp
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const srv = spawn(process.execPath, [path.join(__dirname, 'mcp-server.js')], { cwd: ROOT });

let buffer = '';
const pendientes = new Map();
let n = 0;

srv.stdout.setEncoding('utf8');
srv.stdout.on('data', (d) => {
  buffer += d;
  let i;
  while ((i = buffer.indexOf('\n')) !== -1) {
    const linea = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!linea) continue;
    let msg;
    try { msg = JSON.parse(linea); } catch (e) { continue; }
    if (pendientes.has(msg.id)) { pendientes.get(msg.id)(msg); pendientes.delete(msg.id); }
  }
});
let errores = '';
srv.stderr.on('data', (d) => { errores += d; });

const rpc = (method, params) => new Promise((res, rej) => {
  const id = ++n;
  const t = setTimeout(() => rej(new Error(`sin respuesta a ${method}`)), 8000);
  pendientes.set(id, (m) => { clearTimeout(t); res(m); });
  srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
});
const salida = (r) => JSON.parse(r.result.content[0].text);

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });

comprobar('initialize responde con protocolo y nombre', async () => {
  const r = await rpc('initialize', {});
  if (!r.result?.protocolVersion) throw new Error('sin protocolVersion');
  if (r.result.serverInfo?.name !== 'syx') throw new Error('serverInfo.name inesperado');
});

comprobar('tools/list expone las 8 herramientas con esquema', async () => {
  const r = await rpc('tools/list', {});
  const t = r.result.tools;
  if (t.length !== 8) throw new Error(`esperaba 8 herramientas, hay ${t.length}`);
  for (const x of t) {
    if (!x.description) throw new Error(`${x.name} sin descripción`);
    if (x.inputSchema?.type !== 'object') throw new Error(`${x.name} con esquema mal formado`);
  }
});

comprobar('get_token da valores distintos en claro y oscuro', async () => {
  const tk = '--component-button-primary-filled-bg';
  const a = salida(await rpc('tools/call', { name: 'get_token', arguments: { token: tk, mode: 'light' } }));
  const b = salida(await rpc('tools/call', { name: 'get_token', arguments: { token: tk, mode: 'dark' } }));
  if (!a.encontrado || !b.encontrado) throw new Error('token no encontrado');
  if (a.value === b.value) throw new Error('claro y oscuro dan el mismo valor: la dimensión de modo no llega');
  if (!Array.isArray(b.cadena) || !b.cadena.length) throw new Error('sin cadena de alias');
});

comprobar('get_token responde con sugerencias a un token que no existe', async () => {
  const r = salida(await rpc('tools/call', { name: 'get_token', arguments: { token: '--component-button-inventado' } }));
  if (r.encontrado !== false) throw new Error('deberia no encontrarlo');
  if (!Array.isArray(r.sugerencias)) throw new Error('sin sugerencias');
});

comprobar('find_token_by_value encuentra el token de un color', async () => {
  const t = salida(await rpc('tools/call', { name: 'get_token', arguments: { token: '--semantic-color-primary' } }));
  const r = salida(await rpc('tools/call', { name: 'find_token_by_value', arguments: { value: t.value } }));
  if (!r.exactos.includes('--semantic-color-primary')) throw new Error('no se encuentra a sí mismo');
});

comprobar('get_component solo devuelve clases que existen en el CSS', async () => {
  const r = salida(await rpc('tools/call', { name: 'get_component', arguments: { name: 'btn' } }));
  if (!r.encontrado) throw new Error('btn no encontrado');
  if (!r.classes.includes('atom-btn')) throw new Error('sin la clase base');
  const fs = require('fs');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'styles-theme-syx-sketch.css'), 'utf8');
  for (const m of r.modifiers) if (!css.includes('.' + m)) throw new Error(`modificador fantasma: ${m}`);
});

comprobar('validate_snippet caza R01, R03 y R04 y el token inexistente', async () => {
  const r = salida(await rpc('tools/call', {
    name: 'validate_snippet',
    arguments: {
      code: [
        '.atom-x {',
        '  color: var(--primitive-color-blue-500);',
        '  transition: color 0.2s ease;',
        '  position: absolute;',
        '  background: var(--component-btn-primary-bg);',
        '}',
      ].join('\n'),
    },
  }));
  if (r.conforme) throw new Error('deberia no ser conforme');
  for (const regla of ['R01', 'R03', 'R04']) {
    if (!r.violaciones[regla]) throw new Error(`no detecta ${regla}`);
  }
  if (!r.tokensInexistentes.some((t) => t.token === '--component-btn-primary-bg' && !t.conFallback)) {
    throw new Error('no detecta el token inexistente sin fallback');
  }
});

comprobar('validate_snippet aprueba un fragmento conforme', async () => {
  const r = salida(await rpc('tools/call', {
    name: 'validate_snippet',
    arguments: { code: '.atom-x {\n  color: var(--semantic-color-primary);\n}' },
  }));
  if (!r.conforme) throw new Error('deberia ser conforme: ' + JSON.stringify(r.violaciones));
});

comprobar('classify_change deduce el fichero de un token y el nivel de un cambio', async () => {
  const t = salida(await rpc('tools/call', { name: 'classify_change', arguments: { token: '--component-pill-glow' } }));
  if (!t.destino?.resuelto) throw new Error('no deduce el destino');
  if (!t.destino.fichero.endsWith('_pills.scss')) throw new Error(`lo manda a ${t.destino.fichero}`);
  const c = salida(await rpc('tools/call', { name: 'classify_change', arguments: { paths: ['CHANGELOG.md', 'scss/themes/example-01/_theme.scss'] } }));
  if (c.cambio.tier !== 'human') throw new Error(`nivel ${c.cambio.tier}: un cambio no es más libre que su fichero más delicado`);
});

comprobar('scan_for_drift devuelve un informe bien formado', async () => {
  // No se exige que encuentre N desviaciones: esa cifra baja según se arreglan
  // —ya rompió esta prueba una vez, por haber limpiado docs.html— y aquí lo que
  // se comprueba es el protocolo. Que DETECTE lo prueba check-escaner.js con su
  // fichero de mentira, donde la respuesta es conocida y no cambia sola.
  const r = salida(await rpc('tools/call', { name: 'scan_for_drift', arguments: { files: ['docs.html'] } }));
  if (r.ficheros !== 1) throw new Error(`dice haber leído ${r.ficheros} ficheros`);
  if (typeof r.total !== 'number' || !Array.isArray(r.hallazgos)) throw new Error('informe mal formado');
  if (r.total !== r.hallazgos.length) throw new Error('el total no cuadra con los hallazgos');
  if (r.theme !== 'syx-sketch') throw new Error('no dice contra qué tema compara');
});

comprobar('una herramienta desconocida da error de protocolo, no un cuelgue', async () => {
  const r = await rpc('tools/call', { name: 'no_existe', arguments: {} });
  if (!r.error) throw new Error('deberia devolver error');
});

(async () => {
  console.log('\n── SERVIDOR MCP ────────────────────────────────────────────────\n');
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
  srv.stdin.end();
  if (errores.trim()) console.log(`\n   stderr del servidor:\n   ${errores.trim().split('\n').slice(0, 5).join('\n   ')}`);
  console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
  process.exit(fallos ? 1 : 0);
})();
