/**
 * SYX — Qué entrega cada modo, leído de los propios modos
 * ───────────────────────────────────────────────────────
 * El corrector de las tareas de referencia exigía secciones escritas a mano en
 * tareas.json («## Código», «## Entrega»), en español, mientras los modos piden
 * otras, en inglés («## Contract Check», «## Component File»…). Una respuesta
 * que seguía al pie de la letra el Response Format de su modo suspendía C4: el
 * banco medía obediencia a tareas.json, no al modo.
 *
 * Este módulo saca el catálogo de secciones de la única fuente que el agente
 * lee —el bloque de formato de `_agents/modes/<modo>.md`— y la obligación del
 * `## Why` de `_agents/decision-record.md`. Así, si un modo cambia su formato,
 * las tareas que piden una sección que ya no existe se ponen en rojo en
 * check:evals en vez de seguir midiendo un formato muerto.
 *
 *   seccionesDelModo(modo)  → ['Contract Check', 'Component File', …]
 *   whyDelModo(modo)        → { debe, lugar: 'bloque' | 'lineas', techo }
 *   normalizar(texto)       → clave de comparación sin tildes, mayúsculas ni adornos
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Cómo se llama la sección de formato en cada modo. No es uniforme —AUDIT la
// llama «Violation Report Format», MIGRATE «What You Output»— y forzar un solo
// nombre sería editar nueve documentos para comodidad del corrector.
const TITULO_FORMATO = /^##\s+(Response Format|Output Format|What You Output|Violation Report Format)\s*$/i;

function normalizar(s) {
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[*`]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/[:.\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// «Variable: --{name}» → «Variable»; «Verdict: PASS» → «Verdict»;
// «Structural Config (if needed)» → «Structural Config».
function limpiarTitulo(t) {
  return t.replace(/\s*\(.*?\)\s*/g, ' ').replace(/:.*$/, '').trim();
}

function leerModo(root, modo) {
  const f = path.join(root, '_agents/modes', `${modo}.md`);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
}

/**
 * Los encabezados `## X` que aparecen dentro de bloques de código en la sección
 * de formato del modo, en el orden en que el modo los pide.
 */
function seccionesDelModo(root, modo) {
  const texto = leerModo(root, modo);
  if (!texto) return [];
  const salida = [];
  let dentro = false;
  let enValla = false;
  for (const linea of texto.split(/\r?\n/)) {
    if (/^```/.test(linea.trim())) { enValla = !enValla; continue; }
    if (!enValla && /^##\s/.test(linea)) {
      dentro = TITULO_FORMATO.test(linea);
      continue;
    }
    if (dentro && enValla) {
      const m = linea.match(/^##\s+(.+?)\s*$/);
      if (m) {
        const t = limpiarTitulo(m[1]);
        if (t && !salida.some((x) => normalizar(x) === normalizar(t))) salida.push(t);
      }
    }
  }
  return salida;
}

/**
 * Qué le debe el modo al bloque `## Why`, leído de decision-record.md:
 *   · la tabla «What each mode owes» dice quién está exento (SKETCH);
 *   · «Where it goes» dice qué modos cuelgan las líneas de cada hallazgo en
 *     vez de cerrar con un bloque (AUDIT, MIGRATE);
 *   · el techo es cinco líneas, salvo BRAND: una por eje (siete) más dos.
 */
function whyDelModo(root, modo) {
  const f = path.join(root, '_agents/decision-record.md');
  const texto = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  const M = modo.toUpperCase();
  const fila = texto.split(/\r?\n/).find((l) => l.startsWith(`| **${M}** |`));
  const exento = !fila || /exempt/i.test(fila);
  const dondeVa = texto.split(/^## Where it goes/m)[1] || '';
  const porLineas = new RegExp(`^-\\s+\\*\\*${M}\\*\\*`, 'm').test(dondeVa.split(/^---/m)[0]);
  return {
    debe: !exento,
    lugar: porLineas ? 'lineas' : 'bloque',
    techo: M === 'BRAND' ? 9 : 5,
  };
}

module.exports = { seccionesDelModo, whyDelModo, normalizar, limpiarTitulo };
