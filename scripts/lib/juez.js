/**
 * SYX — Juez opcional para C3 y C5
 * ────────────────────────────────
 * Lo determinista de evaluar.js distingue mencionar de recomendar y sabe en qué
 * sección mira, pero no sabe si una negación es sincera ni si un flujo de UX es
 * bueno. Para eso hay un juez: un modelo con la rúbrica escrita en
 * _agents/evals/juez.md delante, que devuelve JSON.
 *
 * ES OPCIONAL A PROPÓSITO. Sin credenciales se salta con un aviso y la nota
 * determinista sigue valiendo; nada en `npm run check` lo llama, porque un
 * guardián que depende de la red y de un modelo no es reproducible. El juez
 * puede bajar una nota (añade fallos de C3, puntúa C5), nunca subirla: lo que
 * el corrector determinista suspende sigue suspendido.
 *
 * Vías, por orden:
 *   1. ANTHROPIC_API_KEY  → API de Mensajes, modelo SYX_JUEZ_MODELO
 *   2. la CLI `claude`    → `claude -p --output-format json --json-schema …`,
 *                           sin herramientas y fuera del repositorio
 *   SYX_JUEZ=0 lo apaga aunque haya credenciales.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { quitarFrontmatter } = require('./evaluar');

const MODELO = process.env.SYX_JUEZ_MODELO || 'claude-sonnet-4-5';

const ESQUEMA = {
  type: 'object',
  properties: {
    c3: {
      type: 'object',
      properties: { nota: { type: 'integer', minimum: 0, maximum: 2 }, fallos: { type: 'array', items: { type: 'string' } } },
      required: ['nota', 'fallos'],
    },
    c5: {
      type: 'array',
      items: {
        type: 'object',
        properties: { pregunta: { type: 'string' }, nota: { type: 'integer', minimum: 0, maximum: 2 }, porque: { type: 'string' } },
        required: ['pregunta', 'nota', 'porque'],
      },
    },
  },
  required: ['c3', 'c5'],
};

function hayCli() {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['claude'], { encoding: 'utf8' });
  return r.status === 0;
}

function disponible() {
  if (process.env.SYX_JUEZ === '0') return { via: null, motivo: 'SYX_JUEZ=0' };
  if (process.env.ANTHROPIC_API_KEY) return { via: 'api', modelo: MODELO };
  if (hayCli()) return { via: 'cli', modelo: process.env.SYX_JUEZ_MODELO || 'el de la CLI' };
  return { via: null, motivo: 'ni ANTHROPIC_API_KEY ni la CLI claude' };
}

function prompt({ tarea, respuesta, root }) {
  const rubrica = fs.readFileSync(path.join(root, '_agents/evals/juez.md'), 'utf8');
  const resumen = {
    id: tarea.id,
    modo: tarea.modo,
    enunciado: tarea.enunciado,
    debe: (tarea.debe || []).map((d) => d.porque),
    noDebe: (tarea.noDebe || []).map((d) => d.porque),
    criterio: tarea.criterio || [],
  };
  return `${rubrica}\n\n## La tarea\n\n\`\`\`json\n${JSON.stringify(resumen, null, 2)}\n\`\`\`\n\n## La respuesta del agente\n\n<respuesta>\n${respuesta}\n</respuesta>\n`;
}

function extraerJson(texto) {
  const m = String(texto || '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('el juez no devolvió JSON');
  return JSON.parse(m[0]);
}

function validar(j, tarea) {
  if (!j || !j.c3 || ![0, 1, 2].includes(j.c3.nota) || !Array.isArray(j.c5)) throw new Error('JSON del juez sin la forma de la rúbrica');
  // Las preguntas se emparejan por orden: el juez a veces las parafrasea.
  const c5 = (tarea.criterio || []).map((pregunta, i) => {
    const r = j.c5[i] || {};
    return { pregunta, nota: [0, 1, 2].includes(r.nota) ? r.nota : 0, porque: r.porque || 'sin respuesta del juez' };
  });
  return { c3: { nota: j.c3.nota, fallos: j.c3.fallos || [] }, c5 };
}

async function porApi(texto) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODELO, max_tokens: 2000, temperature: 0, messages: [{ role: 'user', content: texto }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const d = await res.json();
  return extraerJson((d.content || []).map((c) => c.text || '').join(''));
}

function porCli(texto) {
  const args = ['-p', '--output-format', 'json', '--max-turns', '3', '--tools', '', '--no-session-persistence', '--json-schema', JSON.stringify(ESQUEMA)];
  if (process.env.SYX_JUEZ_MODELO) args.push('--model', process.env.SYX_JUEZ_MODELO);
  // Fuera del repositorio: el juez no debe cargar CLAUDE.md ni activar modos.
  const r = spawnSync('claude', args, { input: texto, encoding: 'utf8', cwd: os.tmpdir(), timeout: 300000, maxBuffer: 32 * 1024 * 1024 });
  if (r.error) throw r.error;
  let d;
  try { d = JSON.parse(r.stdout); } catch (e) { throw new Error(`la CLI no devolvió JSON (${(r.stderr || r.stdout || '').slice(0, 200)})`); }
  if (d.is_error) throw new Error(`la CLI falló: ${String(d.result).slice(0, 200)}`);
  return d.structured_output || extraerJson(d.result);
}

/**
 * @returns {Promise<{via, modelo, c3, c5} | {via:null, aviso}>}
 */
async function juzgar({ tarea, respuesta, root }) {
  const d = disponible();
  if (!d.via) return { via: null, aviso: `juez saltado: ${d.motivo}. C3 y C5 quedan con lo determinista y las preguntas para una persona.` };
  // La cabecera de anti/ y buenas/ dice qué tiene de malo la respuesta: el
  // juez no la puede ver, o se le estaría dando la nota hecha.
  const texto = prompt({ tarea, respuesta: quitarFrontmatter(respuesta), root });
  try {
    const j = d.via === 'api' ? await porApi(texto) : porCli(texto);
    return { via: d.via, modelo: d.modelo, ...validar(j, tarea) };
  } catch (e) {
    return { via: null, aviso: `juez saltado: ${e.message}` };
  }
}

/**
 * Junta la nota determinista con la del juez. El juez solo resta: en C3 vale
 * la menor de las dos, y C5 aprueba si cada pregunta llega a 1. `apruebaAuto`
 * sigue siendo solo lo determinista; `aprueba` es la nota final, o null si no
 * hubo juez (C5 queda pendiente de una persona).
 */
function combinar(r, juez) {
  if (!juez || !juez.via) return { ...r, juez: juez || null, conJuez: null, aprueba: null };
  const c3 = r.criterios.find((c) => c.id === 'C3');
  const conJuez = r.auto - c3.nota + Math.min(c3.nota, juez.c3.nota);
  const c5ok = juez.c5.every((q) => q.nota >= 1);
  return { ...r, juez, conJuez, aprueba: conJuez === r.max && c5ok };
}

module.exports = { juzgar, combinar, disponible, prompt, ESQUEMA };
