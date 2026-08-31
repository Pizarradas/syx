#!/usr/bin/env node
/**
 * SYX — Servidor MCP sobre la capa de contratos
 * ─────────────────────────────────────────────
 * Expone SYX por Model Context Protocol para que un agente pueda CONSULTARLO en
 * vez de ingerirlo. Es el paso 1.1 del plan agentic, y la frontera exacta entre
 * «legible por máquina» y «consultable»: hoy responder «¿de qué color es el
 * botón primario?» obliga a leer 274 KB de tokens.json más 317 KB de
 * token-contract.json y resolver la cascada a mano. Aquí es una llamada.
 *
 * SIN DEPENDENCIAS
 * MCP sobre stdio es JSON-RPC 2.0 con las líneas delimitadas por saltos: cabe
 * en cien líneas y no justifica arrastrar un SDK a un proyecto cuyo argumento
 * principal es no arrastrar nada. Se implementan los tres métodos que necesita
 * un cliente para funcionar: initialize, tools/list y tools/call.
 *
 * DE DÓNDE SALEN LAS RESPUESTAS
 * De los artefactos de la fase P0, que por primera vez son ciertos:
 *   · contracts/resolved-tokens.json  valores por tema y modo (paso 0.2)
 *   · component-registry.json         clases y tokens reales  (paso 0.1)
 *   · css/styles-theme-*.css          para la cadena de alias, bajo demanda
 *   · scripts/lib/rules.js            R01–R04, las mismas que el validador
 *
 * QUÉ HACE ESTE FICHERO Y QUÉ NO
 * Solo protocolo: leer líneas, despachar métodos, escribir respuestas. Las
 * consultas viven en scripts/lib/consulta.js porque también las usa index.js,
 * que es la cara del paquete instalado. Un agente por MCP y una aplicación por
 * `require` tienen que obtener la misma respuesta a la misma pregunta.
 *
 * Registro en un cliente MCP:
 *   { "command": "node", "args": ["scripts/mcp-server.js"], "cwd": "<repo>" }
 */

'use strict';

const path = require('path');
const { crearConsulta } = require('./lib/consulta');

const ROOT = path.join(__dirname, '..');
const syx = crearConsulta({ root: ROOT });

// ─── Herramientas ────────────────────────────────────────────────────────────
// Cada una es una descripción para el agente, un esquema de entrada y una
// llamada a la capa de consulta. Nada de lógica propia: si aquí hubiera lógica,
// sería lógica que la API de Node no tiene.

const HERRAMIENTAS = [
  {
    name: 'list_themes',
    description: 'Los temas disponibles y sus modos. Empieza por aquí si no sabes qué nombre pasar a las demás herramientas.',
    inputSchema: { type: 'object', properties: {} },
    run: () => syx.listThemes(),
  },

  {
    name: 'get_token',
    description: 'El valor REAL de un token en un tema y un modo, con la cadena de alias que lo produce. Responde a "¿de qué color es esto aquí?" sin tener que resolver la cascada.',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Nombre completo, p. ej. --component-button-primary-filled-bg' },
        theme: { type: 'string', description: 'Por defecto syx-sketch' },
        mode: { type: 'string', enum: ['light', 'dark'], description: 'Por defecto light' },
      },
      required: ['token'],
    },
    run: (a) => syx.getToken(a),
  },

  {
    name: 'find_token_by_value',
    description: 'Qué token o tokens valen un color o medida concretos. Es la consulta que evita escribir el valor a pelo: antes de poner un #1e3aff en una hoja, preguntar cuál es su token.',
    inputSchema: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'p. ej. oklch(0.498 0.282 266.24) o 1.5rem' },
        theme: { type: 'string' },
        mode: { type: 'string', enum: ['light', 'dark'] },
      },
      required: ['value'],
    },
    run: (a) => syx.findTokenByValue(a),
  },

  {
    name: 'list_components',
    description: 'El inventario de componentes con su capa y sus clases base. Generado desde el código y contrastado contra el CSS compilado: lo que sale de aquí existe.',
    inputSchema: {
      type: 'object',
      properties: { layer: { type: 'string', enum: ['atom', 'molecule', 'organism'] } },
    },
    run: (a) => syx.listComponents(a),
  },

  {
    name: 'get_component',
    description: 'Todo lo de un componente: clases, modificadores, elementos, estados, de qué se compone y qué tokens consume. Todos verificados contra el CSS compilado.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'p. ej. btn, feature-card, site-header' } },
      required: ['name'],
    },
    run: (a) => syx.getComponent(a),
  },

  {
    name: 'validate_snippet',
    description: 'Pasa las reglas de contrato R01–R04 sobre un fragmento de SCSS ANTES de escribirlo, y avisa de los tokens que usa y no existen. Las mismas reglas que ejecuta npm run validate.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'El SCSS a revisar' },
        path: { type: 'string', description: 'Dónde va a vivir. Importa: las excepciones dependen de la ruta. Por defecto scss/atoms/_nuevo.scss, que es el contexto más estricto.' },
      },
      required: ['code'],
    },
    run: (a) => syx.validateSnippet(a),
  },

  {
    name: 'classify_change',
    description: 'Antes de tocar nada: qué nivel de confianza tiene cambiar estos ficheros (automático, vía propuesta o solo humano) y, si preguntas por un token nuevo, en qué fichero va — deducido de su familia, no de una tabla. Sin argumentos, devuelve los tres niveles y qué abarca cada uno.',
    inputSchema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Rutas relativas al repositorio que el cambio tocaría',
        },
        token: {
          type: 'string',
          description: 'Un token --component-* que quieras crear; responde con el fichero donde debe ir',
        },
      },
    },
    run: (a) => syx.classifyChange(a),
  },
];

// ─── JSON-RPC sobre stdio ────────────────────────────────────────────────────

function responder(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function fallar(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

function manejar(msg) {
  const { id, method, params } = msg;
  // Las notificaciones no llevan id y no se responden.
  if (id === undefined) return;

  if (method === 'initialize') {
    return responder(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'syx', version: syx.version },
    });
  }

  if (method === 'tools/list') {
    return responder(id, {
      tools: HERRAMIENTAS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    });
  }

  if (method === 'tools/call') {
    const h = HERRAMIENTAS.find((x) => x.name === params?.name);
    if (!h) return fallar(id, -32601, `Herramienta desconocida: ${params?.name}`);
    try {
      const salida = h.run(params.arguments || {});
      return responder(id, { content: [{ type: 'text', text: JSON.stringify(salida, null, 2) }] });
    } catch (e) {
      // El error va como resultado y no como fallo de protocolo: así el agente
      // lo lee y puede corregir, en vez de recibir una excepción opaca.
      return responder(id, {
        content: [{ type: 'text', text: JSON.stringify({ error: e.message }, null, 2) }],
        isError: true,
      });
    }
  }

  fallar(id, -32601, `Método no soportado: ${method}`);
}

function main() {
  // Una consulta cualquiera fuerza la carga: si faltan los artefactos, es mejor
  // enterarse al arrancar que en la primera pregunta del agente.
  syx.listThemes();
  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (trozo) => {
    buffer += trozo;
    let corte;
    while ((corte = buffer.indexOf('\n')) !== -1) {
      const linea = buffer.slice(0, corte).trim();
      buffer = buffer.slice(corte + 1);
      if (!linea) continue;
      try {
        manejar(JSON.parse(linea));
      } catch (e) {
        fallar(null, -32700, 'JSON mal formado: ' + e.message);
      }
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

main();
