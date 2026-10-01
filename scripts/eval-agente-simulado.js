#!/usr/bin/env node
/**
 * SYX — Un agente de mentira para probar el runner sin red
 * ────────────────────────────────────────────────────────
 * scripts/eval-runner.js lanza un agente por tarea. Para comprobar que el
 * runner copia, lanza, interpreta la salida, corrige y resume bien hace falta
 * un agente cuya respuesta se conoce de antemano: este. Devuelve la referencia
 * de la tarea, o una anti-referencia, imitando la salida de `claude -p`.
 *
 *   SYX_AGENT_CMD="node $PWD/scripts/eval-agente-simulado.js" \
 *   SYX_SIMULADO=anti node scripts/eval-runner.js --sin-juez
 *
 * SYX_SIMULADO          referencia (por defecto) · anti · nada (falla)
 * SYX_SIMULADO_FORMATO  stream (por defecto, como --output-format stream-json)
 *                       · json · texto
 *
 * Lee la tarea de SYX_EVAL_ID, que el runner pone en el entorno. Las
 * respuestas las lee de ESTE repositorio (el de __dirname), no de la copia en
 * la que corre: la copia no lleva referencias, precisamente para que un agente
 * de verdad no pueda leerlas.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { cargarBanco, leerEjemplos } = require('./lib/banco');

const ROOT = path.join(__dirname, '..');
const id = process.env.SYX_EVAL_ID;
const que = process.env.SYX_SIMULADO || 'referencia';
const formato = process.env.SYX_SIMULADO_FORMATO || 'stream';

const { EVALS, tareas } = cargarBanco(ROOT);
const tarea = tareas.find((t) => t.id === id);
if (!tarea || que === 'nada') {
  console.error(`agente simulado: ${tarea ? 'falla a propósito' : `no hay tarea «${id}»`}`);
  process.exit(2);
}

// El runner promete que la copia no lleva las soluciones. Si las lleva, un
// agente de verdad podría copiarlas: se falla aquí, a la vista.
if (process.env.SYX_EVAL_DIR && fs.existsSync(path.join(process.env.SYX_EVAL_DIR, '_agents/evals/referencias'))) {
  console.error('agente simulado: la copia lleva _agents/evals/referencias/ — el runner filtra las soluciones');
  process.exit(3);
}

let respuesta;
if (que === 'anti') {
  const a = leerEjemplos(path.join(EVALS, 'anti')).find((x) => x.cab.tarea === id);
  // Una tarea sin anti-referencia recibe una respuesta vacía de contenido:
  // también tiene que suspender.
  respuesta = a ? a.texto.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '') : 'Hecho.';
} else {
  respuesta = fs.readFileSync(path.join(EVALS, tarea.referencia), 'utf8');
}

if (formato === 'texto') {
  process.stdout.write(respuesta);
} else if (formato === 'json') {
  process.stdout.write(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: respuesta, num_turns: 1, total_cost_usd: 0 }));
} else {
  const ev = [
    { type: 'system', subtype: 'init', model: 'simulado', mcp_servers: [{ name: 'syx', status: 'connected' }] },
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'mcp__syx__get_component', input: { name: tarea.id } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', content: 'respuesta simulada' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: respuesta }] } },
    { type: 'result', subtype: 'success', is_error: false, result: respuesta, num_turns: 2, total_cost_usd: 0 },
  ];
  process.stdout.write(ev.map((e) => JSON.stringify(e)).join('\n') + '\n');
}
