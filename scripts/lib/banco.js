/**
 * SYX — El banco de tareas de los modos, cargado una vez
 * ──────────────────────────────────────────────────────
 * Tres scripts leen _agents/evals/ (eval-modo, check-evals y eval-runner) y
 * los tres necesitan lo mismo: las tareas con sus reglas comunes ya expandidas,
 * el diccionario de equivalentes ES/EN, y los ficheros de anti/ y buenas/ con
 * la tarea a la que apuntan. Si cada uno lo leyera a su manera, el día que el
 * formato cambie uno de ellos corregiría con reglas distintas a los otros dos.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function cargarBanco(root) {
  const EVALS = path.join(root, '_agents/evals');
  const crudo = JSON.parse(fs.readFileSync(path.join(EVALS, 'tareas.json'), 'utf8'));
  const comunes = crudo.comunes || {};
  const errores = [];
  const expandir = (lista, id) => (lista || []).map((r) => {
    if (!r.comun) return r;
    if (!comunes[r.comun]) { errores.push(`${id}: la regla común «${r.comun}» no existe`); return { re: '(?!)', porque: r.comun }; }
    return { ...comunes[r.comun], ...r, comun: undefined };
  });
  const tareas = crudo.tareas.map((t) => ({ ...t, debe: expandir(t.debe, t.id), noDebe: expandir(t.noDebe, t.id) }));
  return { EVALS, tareas, equivalentes: crudo.equivalentes || {}, errores, crudo };
}

/**
 * Las respuestas de anti/ y buenas/ llevan una cabecera mínima:
 *
 *   ---
 *   tarea: audit-01
 *   daño: aprueba un fragmento con cuatro errores de contrato
 *   ---
 */
function leerEjemplos(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md').sort().map((f) => {
    const texto = fs.readFileSync(path.join(dir, f), 'utf8');
    const cab = {};
    const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (m) {
      for (const l of m[1].split(/\r?\n/)) {
        const kv = l.match(/^([\wñáéíóú]+):\s*(.*)$/i);
        if (kv) cab[kv[1]] = kv[2].trim();
      }
    }
    return { fichero: f, cab, texto };
  });
}

module.exports = { cargarBanco, leerEjemplos };
