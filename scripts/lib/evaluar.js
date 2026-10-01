/**
 * SYX — Corrector de las tareas de referencia de los modos
 * ────────────────────────────────────────────────────────
 * Puntúa una respuesta contra una tarea de _agents/evals/tareas.json con la
 * rúbrica de _agents/evals/README.md. Cuatro criterios se miden solos; el
 * quinto (criterio de dominio) son preguntas para una persona o para AUDIT, y
 * el corrector las devuelve sin puntuarlas: fingir que una expresión regular
 * sabe si un flujo de UX es bueno sería peor que no medir nada.
 *
 *   C1 Contrato    cada bloque ```scss pasa validate_snippet en la ruta de la tarea
 *   C2 Tokens      cada --semantic-* / --component-* nombrado existe (o es nuevo y permitido)
 *   C3 Frontera    lo que la tarea exige decir y lo que no puede decir
 *   C4 Entrega     las secciones que la tarea pide
 *   C5 Criterio    preguntas, sin nota automática
 */

'use strict';

const BLOQUE_SCSS = /```scss\n([\s\S]*?)```/g;
const TOKEN = /--(?:semantic|component|primitive)-[a-z0-9-]*[a-z0-9]/g;

function nota(fallos, total) {
  if (!fallos) return 2;
  return fallos === 1 && total > 1 ? 1 : 0;
}

function evaluar({ tarea, respuesta, syx }) {
  const criterios = [];

  // C1 · Contrato
  const bloques = [...respuesta.matchAll(BLOQUE_SCSS)].map((m) => m[1]);
  const c1 = { id: 'C1', nombre: 'Contrato', max: 2, detalle: [] };
  if (tarea.scss) {
    if (bloques.length < (tarea.scss.minBloques || 1)) c1.detalle.push(`se esperaba código SCSS para ${tarea.scss.ruta} y no hay bloque \`\`\`scss`);
    bloques.forEach((code, i) => {
      const r = syx.validateSnippet({ code, path: tarea.scss.ruta });
      for (const [regla, v] of Object.entries(r.violaciones || {})) {
        const n = Array.isArray(v) ? v.length : (v && v.casos ? v.casos.length : 1);
        c1.detalle.push(`bloque ${i + 1}: ${regla} (${n})`);
      }
      // Un bloque que no parsea no ha pasado el contrato: no se ha podido mirar.
      if (r.sintaxis) c1.detalle.push(`bloque ${i + 1}: no parsea (${r.sintaxis.content})`);
    });
  }
  c1.nota = c1.detalle.length ? 0 : 2;
  criterios.push(c1);

  // C2 · Tokens reales
  const c2 = { id: 'C2', nombre: 'Tokens reales', max: 2, detalle: [] };
  const nuevos = tarea.tokens && tarea.tokens.nuevos ? new RegExp(tarea.tokens.nuevos) : null;
  const ignorar = tarea.tokens && tarea.tokens.ignorar ? new RegExp(tarea.tokens.ignorar) : null;
  const vistos = new Set(respuesta.match(TOKEN) || []);
  for (const t of vistos) {
    if (ignorar && ignorar.test(t)) continue;
    if (nuevos && nuevos.test(t)) continue;
    if (t.startsWith('--primitive-')) continue; // R01 lo mide C1 donde importa
    const r = syx.getToken({ token: t });
    if (!r.encontrado) c2.detalle.push(`${t} no existe${r.sugerencias && r.sugerencias.length ? ` (¿${r.sugerencias.slice(0, 2).join(', ')}?)` : ''}`);
  }
  c2.nota = c2.detalle.length ? 0 : 2;
  criterios.push(c2);

  // C3 · Frontera y obligaciones
  const c3 = { id: 'C3', nombre: 'Frontera', max: 2, detalle: [] };
  const reglas = (tarea.debe || []).length + (tarea.noDebe || []).length;
  for (const d of tarea.debe || []) {
    if (!new RegExp(d.re, 'i').test(respuesta)) c3.detalle.push(`falta: ${d.porque}`);
  }
  for (const d of tarea.noDebe || []) {
    if (new RegExp(d.re, 'i').test(respuesta)) c3.detalle.push(`sobra: ${d.porque}`);
  }
  c3.nota = nota(c3.detalle.length, reglas);
  criterios.push(c3);

  // C4 · Forma de la entrega
  const c4 = { id: 'C4', nombre: 'Entrega', max: 2, detalle: [] };
  const lineas = respuesta.split(/\r?\n/).map((l) => l.trim());
  for (const s of tarea.secciones || []) {
    if (!lineas.includes(s)) c4.detalle.push(`falta la sección «${s}»`);
  }
  c4.nota = nota(c4.detalle.length, (tarea.secciones || []).length);
  criterios.push(c4);

  const auto = criterios.reduce((a, c) => a + c.nota, 0);
  const max = criterios.reduce((a, c) => a + c.max, 0);
  return {
    tarea: tarea.id,
    modo: tarea.modo,
    criterios,
    auto,
    max,
    apruebaAuto: auto === max,
    criterio: tarea.criterio || [],
  };
}

module.exports = { evaluar };
