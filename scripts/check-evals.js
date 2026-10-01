#!/usr/bin/env node
/**
 * SYX — Las tareas de referencia de los modos se sostienen
 * ────────────────────────────────────────────────────────
 * Un banco de pruebas que nadie prueba se pudre igual que el código. Esto
 * comprueba el banco, no a los agentes:
 *
 *   1. Cada modo que hay en _agents/modes/ tiene al menos dos tareas.
 *   2. Cada tarea está bien formada: enunciado, criterio, referencia, mutante,
 *      reglas con una forma conocida y expresiones válidas, y las secciones que
 *      pide existen en el Response Format de su modo (se leen del modo: si el
 *      modo cambia su formato, la tarea se pone en rojo aquí).
 *   3. Cada referencia saca la nota automática completa, y también la saca con
 *      los encabezados traducidos al español: el corrector mide el contenido,
 *      no el idioma de los títulos.
 *   4. Cada mutante (la referencia con un solo fallo sembrado) suspende.
 *   5. Cada anti-referencia de _agents/evals/anti/ —una respuesta dañina
 *      escrita para engañar al corrector— suspende en la parte determinista.
 *      Es la comprobación que justifica las reglas con forma: la primera
 *      versión del corrector dejaba aprobar ocho de ellas con 8/8.
 *   6. Cada respuesta de _agents/evals/buenas/ —correcta, pero escrita de otra
 *      manera que la referencia— aprueba. Sin esto, endurecer el corrector
 *      contra las anti sale gratis aunque suspenda respuestas buenas.
 *
 * Sin red: el juez (scripts/lib/juez.js) no se llama nunca desde aquí.
 *
 * Uso: node scripts/check-evals.js   ·   npm run check:evals
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { crearConsulta } = require('./lib/consulta');
const { evaluar } = require('./lib/evaluar');
const { cargarBanco, leerEjemplos } = require('./lib/banco');
const { seccionesDelModo, whyDelModo, normalizar } = require('./lib/formato-modos');

const ROOT = path.join(__dirname, '..');
const { EVALS, tareas, equivalentes, errores: erroresBanco } = cargarBanco(ROOT);
const syx = crearConsulta({ root: ROOT });
const corregir = (tarea, respuesta) => evaluar({ tarea, respuesta, syx, equivalentes });
const motivo = (r) => r.criterios.filter((c) => c.nota < c.max).map((c) => `${c.id}: ${c.detalle.join('; ')}`).join(' | ');

const errores = [...erroresBanco];
const FORMAS = { debe: ['menciona', 'afirma'], noDebe: ['menciona', 'recomienda'] };
let ok = 0;

console.log('\n── TAREAS DE REFERENCIA DE LOS MODOS ──────────────────────────\n');

// 1 · cobertura, leída del directorio
const modos = fs.readdirSync(path.join(ROOT, '_agents/modes'))
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .map((f) => f.replace(/\.md$/, ''));
for (const m of modos) {
  const n = tareas.filter((t) => t.modo === m).length;
  if (n < 2) errores.push(`el modo ${m} tiene ${n} tarea(s); mínimo 2`);
}
for (const t of tareas.filter((x) => !modos.includes(x.modo))) errores.push(`${t.id}: el modo «${t.modo}» no existe en _agents/modes/`);

// 2 · forma
const ids = new Set();
for (const t of tareas) {
  if (ids.has(t.id)) errores.push(`${t.id}: id repetido`);
  ids.add(t.id);
  for (const k of ['enunciado', 'referencia', 'mutante', 'criterio']) {
    if (!t[k] || (Array.isArray(t[k]) && !t[k].length)) errores.push(`${t.id}: falta «${k}»`);
  }
  if (!Array.isArray(t.secciones)) errores.push(`${t.id}: falta «secciones» (puede ser [] si el modo no pide ninguna para esta tarea)`);
  if (t.fixture && !fs.existsSync(path.join(EVALS, t.fixture))) errores.push(`${t.id}: no existe ${t.fixture}`);
  const catalogo = seccionesDelModo(ROOT, t.modo);
  for (const s of (t.secciones || []).flat()) {
    if (!catalogo.some((c) => normalizar(c) === normalizar(s))) errores.push(`${t.id}: pide «${s}», que no está en el Response Format de ${t.modo}.md (${catalogo.join(', ') || 'sin secciones'})`);
  }
  const why = whyDelModo(ROOT, t.modo);
  if (t.sinWhy && !why.debe) errores.push(`${t.id}: «sinWhy» en un modo que no debe Why`);
  if (t.sinWhy !== undefined && String(t.sinWhy).length < 40) errores.push(`${t.id}: «sinWhy» necesita su porqué, no un sí/no`);
  for (const lado of ['debe', 'noDebe']) {
    for (const d of t[lado] || []) {
      for (const k of ['re', 'junto']) {
        if (d[k] === undefined) continue;
        try { new RegExp(d[k], 'iu'); } catch (e) { errores.push(`${t.id}: expresión inválida ${d[k]}`); }
      }
      if (!d.re) errores.push(`${t.id}: regla sin «re» en ${lado}`);
      if (!d.porque) errores.push(`${t.id}: regla sin «porque» (${d.re})`);
      if (d.forma && !FORMAS[lado].includes(d.forma)) errores.push(`${t.id}: forma «${d.forma}» no vale en ${lado} (${FORMAS[lado].join(' · ')})`);
      if (d.seccion && normalizar(d.seccion) !== 'why' && !catalogo.some((c) => normalizar(c) === normalizar(d.seccion))) errores.push(`${t.id}: la regla mira en «${d.seccion}», que el modo no tiene`);
    }
  }
}

// La referencia con cada encabezado del modo cambiado por su primer
// equivalente en español. Si la nota baja, el corrector depende del idioma.
function traducir(texto, tarea) {
  const eq = { ...equivalentes, ...(tarea.equivalentes || {}) };
  return texto.split('\n').map((l) => {
    const h = l.match(/^(#{1,4})\s+(.+)$/);
    if (!h) return l;
    const n = normalizar(h[2]);
    for (const [canonica, alias] of Object.entries(eq)) {
      const c = normalizar(canonica);
      if ((n === c || n.startsWith(`${c}:`)) && alias.length) return `${h[1]} ${alias[0]}${h[2].slice(canonica.length).replace(/^\s*\(.*?\)/, '')}`;
    }
    return l;
  }).join('\n');
}

// 3 y 4 · referencia aprueba (en los dos idiomas), mutante suspende
for (const t of tareas) {
  const ruta = path.join(EVALS, t.referencia || '');
  if (!t.referencia || !fs.existsSync(ruta)) { errores.push(`${t.id}: no existe la referencia`); continue; }
  const ref = fs.readFileSync(ruta, 'utf8');
  const r = corregir(t, ref);
  if (!r.apruebaAuto) { errores.push(`${t.id}: la referencia no aprueba (${r.auto}/${r.max}) — ${motivo(r)}`); continue; }
  const es = corregir(t, traducir(ref, t));
  if (!es.apruebaAuto) { errores.push(`${t.id}: la referencia con encabezados en español no aprueba (${es.auto}/${es.max}) — ${motivo(es)}`); continue; }
  if (!t.mutante || !ref.includes(t.mutante.buscar)) {
    errores.push(`${t.id}: el mutante no encuentra «${t.mutante && t.mutante.buscar}» en la referencia`);
    continue;
  }
  const mut = corregir(t, ref.split(t.mutante.buscar).join(t.mutante.poner));
  if (mut.apruebaAuto) { errores.push(`${t.id}: el mutante aprueba — el corrector no ve ese fallo`); continue; }
  ok++;
}

// 5 · anti-referencias: todas suspenden
const anti = leerEjemplos(path.join(EVALS, 'anti'));
let antiOk = 0;
if (anti.length < 8) errores.push(`anti/ tiene ${anti.length} respuestas dañinas; mínimo 8`);
for (const a of anti) {
  const t = tareas.find((x) => x.id === a.cab.tarea);
  if (!t) { errores.push(`anti/${a.fichero}: «tarea: ${a.cab.tarea}» no existe`); continue; }
  if (!a.cab['daño']) { errores.push(`anti/${a.fichero}: falta «daño:», qué tiene de dañina`); continue; }
  const r = corregir(t, a.texto);
  if (r.apruebaAuto) { errores.push(`anti/${a.fichero}: aprueba (${r.auto}/${r.max}) siendo dañina — ${a.cab['daño']}`); continue; }
  antiOk++;
}

// 6 · respuestas buenas alternativas: todas aprueban
const buenas = leerEjemplos(path.join(EVALS, 'buenas'));
let buenasOk = 0;
for (const b of buenas) {
  const t = tareas.find((x) => x.id === b.cab.tarea);
  if (!t) { errores.push(`buenas/${b.fichero}: «tarea: ${b.cab.tarea}» no existe`); continue; }
  const r = corregir(t, b.texto);
  if (!r.apruebaAuto) { errores.push(`buenas/${b.fichero}: suspende (${r.auto}/${r.max}) siendo correcta — ${motivo(r)}`); continue; }
  buenasOk++;
}

for (const e of errores) console.log(`❌ ${e}`);
if (!errores.length) {
  console.log(`✅ ${modos.length} modos cubiertos · ${tareas.length} tareas, con sus secciones leídas de cada modo`);
  console.log(`✅ ${ok}/${tareas.length} referencias aprueban (también en español) y sus mutantes suspenden`);
  console.log(`✅ ${antiOk}/${anti.length} anti-referencias suspenden`);
  console.log(`✅ ${buenasOk}/${buenas.length} respuestas buenas alternativas aprueban`);
}
console.log('');
process.exitCode = errores.length ? 1 : 0;
