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

comprobar('tools/list expone las 12 herramientas con esquema', async () => {
  const r = await rpc('tools/list', {});
  const t = r.result.tools;
  if (t.length !== 12) throw new Error(`esperaba 12 herramientas, hay ${t.length}`);
  for (const x of t) {
    if (!x.description) throw new Error(`${x.name} sin descripción`);
    if (x.inputSchema?.type !== 'object') throw new Error(`${x.name} con esquema mal formado`);
  }
});

comprobar('get_token da valores distintos en claro y oscuro', async () => {
  const tk = '--component-button-primary-filled-bg';
  const a = salida(await rpc('tools/call', { name: 'get_token', arguments: { token: tk, mode: 'light' } }));
  const b = salida(await rpc('tools/call', { name: 'get_token', arguments: { token: tk, mode: 'dark' } }));
  if (!a.found || !b.found) throw new Error('token no encontrado');
  if (a.value === b.value) throw new Error('claro y oscuro dan el mismo valor: la dimensión de modo no llega');
  if (!Array.isArray(b.chain) || !b.chain.length) throw new Error('sin cadena de alias');
});

comprobar('get_token responde con sugerencias a un token que no existe', async () => {
  const r = salida(await rpc('tools/call', { name: 'get_token', arguments: { token: '--component-button-inventado' } }));
  if (r.found !== false) throw new Error('deberia no encontrarlo');
  if (!Array.isArray(r.suggestions)) throw new Error('sin sugerencias');
});

comprobar('find_token_by_value encuentra el token de un color', async () => {
  const t = salida(await rpc('tools/call', { name: 'get_token', arguments: { token: '--semantic-color-primary' } }));
  const r = salida(await rpc('tools/call', { name: 'find_token_by_value', arguments: { value: t.value } }));
  if (!r.exact.includes('--semantic-color-primary')) throw new Error('no se encuentra a sí mismo');
});

comprobar('get_component solo devuelve clases que existen en el CSS', async () => {
  const r = salida(await rpc('tools/call', { name: 'get_component', arguments: { name: 'btn' } }));
  if (!r.found) throw new Error('btn no encontrado');
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
  if (r.valid) throw new Error('deberia no ser conforme');
  for (const regla of ['R01', 'R03', 'R04']) {
    if (!r.violations[regla]) throw new Error(`no detecta ${regla}`);
  }
  if (!r.unknownTokens.some((t) => t.token === '--component-btn-primary-bg' && !t.hasFallback)) {
    throw new Error('no detecta el token inexistente sin fallback');
  }
});

comprobar('validate_snippet aprueba un fragmento conforme', async () => {
  const r = salida(await rpc('tools/call', {
    name: 'validate_snippet',
    arguments: { code: '.atom-x {\n  color: var(--semantic-color-primary);\n}' },
  }));
  if (!r.valid) throw new Error('deberia ser conforme: ' + JSON.stringify(r.violations));
});

comprobar('classify_change deduce el fichero de un token y el nivel de un cambio', async () => {
  const t = salida(await rpc('tools/call', { name: 'classify_change', arguments: { token: '--component-pill-glow' } }));
  if (!t.destination?.resolved) throw new Error('no deduce el destino');
  if (!t.destination.file.endsWith('_pills.scss')) throw new Error(`lo manda a ${t.destination.file}`);
  const c = salida(await rpc('tools/call', { name: 'classify_change', arguments: { paths: ['CHANGELOG.md', 'scss/themes/example-01/_theme.scss'] } }));
  if (c.change.tier !== 'human') throw new Error(`nivel ${c.change.tier}: un cambio no es más libre que su fichero más delicado`);
});

comprobar('scan_for_drift devuelve un informe bien formado', async () => {
  // No se exige que encuentre N desviaciones: esa cifra baja según se arreglan
  // —ya rompió esta prueba una vez, por haber limpiado docs.html— y aquí lo que
  // se comprueba es el protocolo. Que DETECTE lo prueba check-escaner.js con su
  // fichero de mentira, donde la respuesta es conocida y no cambia sola.
  const r = salida(await rpc('tools/call', { name: 'scan_for_drift', arguments: { files: ['docs.html'] } }));
  if (r.files !== 1) throw new Error(`dice haber leído ${r.files} ficheros`);
  if (typeof r.total !== 'number' || !Array.isArray(r.findings)) throw new Error('informe mal formado');
  if (r.total !== r.findings.length) throw new Error('el total no cuadra con los hallazgos');
  if (r.theme !== 'syx-sketch') throw new Error('no dice contra qué tema compara');
});

comprobar('get_mixin trae la firma y los parámetros leídos del SCSS', async () => {
  const r = salida(await rpc('tools/call', { name: 'get_mixin', arguments: { name: 'position' } }));
  if (!r.found) throw new Error('no encuentra position');
  if (!r.params.some((p) => p.name === '$top' && p.default === 'null')) throw new Error('no lee los valores por defecto');
  // Los alias son la forma en que de verdad se escribe: nadie llama a
  // `position(absolute, …)` teniendo `absolute(…)`.
  if (!r.alias.includes('absolute')) throw new Error(`sin alias: ${JSON.stringify(r.alias)}`);
});

comprobar('list_mixins cuenta los usos, no solo los nombres', async () => {
  const r = salida(await rpc('tools/call', { name: 'list_mixins', arguments: {} }));
  if (r.total < 40) throw new Error(`solo ${r.total} mixins`);
  if (!r.mixins.some((m) => m.uses > 0)) throw new Error('ninguno con usos: no está contando');
});

comprobar('validate_snippet dice QUÉ mixin usar, no solo que está mal', async () => {
  const r = salida(await rpc('tools/call', {
    name: 'validate_snippet',
    arguments: { code: '.x {\n  transition: color 0.2s ease;\n  position: absolute;\n}' },
  }));
  if (r.violations.R03?.replacement?.mixin !== 'transition') throw new Error('R03 no ofrece recambio');
  if (r.violations.R04?.replacement?.mixin !== 'position') throw new Error('R04 no ofrece recambio');
  if (!r.violations.R04.replacement.alias.includes('absolute')) throw new Error('R04 no ofrece el alias corto');
});

comprobar('get_figma_spec devuelve números, no CSS, y cambia con el modo', async () => {
  const pedir = (mode) => rpc('tools/call', { name: 'get_figma_spec', arguments: { component: 'btn', mode } });
  const a = salida(await pedir('light'));
  const b = salida(await pedir('dark'));
  if (!a.found) throw new Error('btn no encontrado');
  if (a.figmaName !== 'atom/btn') throw new Error(`nombre en Figma inesperado: ${a.figmaName}`);
  if (!a.classes.base.includes('atom-btn')) throw new Error('no lleva la clase del registro');

  // Lo que justifica que esta herramienta exista: un nodo de Figma no acepta
  // `oklch(…)`. Si aquí sale una cadena de CSS, el agente la copiaría tal cual.
  const fill = a.properties.find((p) => p.token === '--component-button-primary-filled-bg');
  if (!fill) throw new Error('sin el fondo del botón primario');
  if (fill.property !== 'fills') throw new Error(`lo manda a ${fill.property}`);
  if (typeof fill.value?.r !== 'number') throw new Error('el color no viene en RGB numérico');

  const oscuro = b.properties.find((p) => p.token === fill.token);
  if (JSON.stringify(fill.value) === JSON.stringify(oscuro.value)) {
    throw new Error('claro y oscuro dan el mismo color: la dimensión de modo no llega');
  }

  // Un tipo en una propiedad que no lo admite es peor que la propiedad ausente.
  for (const p of a.properties) {
    if (p.type === 'STRING' && !p.property.startsWith('fontName')) {
      throw new Error(`${p.token} mete un STRING en ${p.property}`);
    }
  }
  // Y lo descartado se descarta con motivo, que es lo que impide que un agente
  // salga a buscar en Figma algo que Figma no tiene.
  for (const lista of [a.untranslated, a.unmapped]) {
    if (lista.some((x) => !x.reason)) throw new Error('hay descartes sin motivo');
  }
});

comprobar('find_capability encuentra por concepto, no por nombre, y dice lo que no sabe', async () => {
  const pedir = (query) => rpc('tools/call', { name: 'find_capability', arguments: { query } }).then(salida);
  // El caso que lo motivó: un nombre que no existe tiene que llevar a lo que sí.
  const a = await pedir('--semantic-space-fluid-sm');
  if (a.matches[0]?.id !== 'fluid-spacing' || a.matches[0].status !== 'done') throw new Error(`--semantic-space-fluid-sm → ${JSON.stringify(a.matches.map((m) => m.id))}`);
  if (!a.matches[0].evidence.every((e) => typeof e.line === 'number')) throw new Error('evidencia sin línea');
  const b = await pedir('tokens desde Figma a _primitives.scss');
  if (b.matches[0]?.status !== 'rejected' || !b.matches[0].decision) throw new Error('lo descartado no viene con su decisión');
  const c = await pedir('zzz qwerty');
  if (c.found !== false || !c.note) throw new Error('una consulta sin resultado no avisa de que eso no prueba nada');
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
