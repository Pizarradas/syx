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
 *   · scripts/lib/rules.js            R01–R04, R09–R11: el mismo motor que el validador
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
    description: 'The available themes and their modes. Start here if you do not know which theme name to pass to the other tools.',
    inputSchema: { type: 'object', properties: {} },
    run: () => syx.listThemes(),
  },

  {
    name: 'get_token',
    description: 'The REAL value of a token in a theme and mode, with the alias chain that produces it (`chain`). Answers "what colour is this here?" without resolving the cascade yourself. `found: false` comes with `suggestions`.',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'Full name, e.g. --component-button-primary-filled-bg' },
        theme: { type: 'string', description: 'Defaults to syx-sketch' },
        mode: { type: 'string', enum: ['light', 'dark'], description: 'Defaults to light' },
      },
      required: ['token'],
    },
    run: (a) => syx.getToken(a),
  },

  {
    name: 'find_token_by_value',
    description: 'Which token(s) hold a given colour or measure (`exact`, or `partial` matches). Ask this before hardcoding a value: before writing #1e3aff in a stylesheet, find its token.',
    inputSchema: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'e.g. oklch(0.498 0.282 266.24) or 1.5rem' },
        theme: { type: 'string' },
        mode: { type: 'string', enum: ['light', 'dark'] },
      },
      required: ['value'],
    },
    run: (a) => syx.findTokenByValue(a),
  },

  {
    name: 'list_components',
    description: 'The component inventory with each layer and base classes. Generated from the code and checked against the compiled CSS: whatever this returns exists.',
    inputSchema: {
      type: 'object',
      properties: { layer: { type: 'string', enum: ['atom', 'molecule', 'organism'] } },
    },
    run: (a) => syx.listComponents(a),
  },

  {
    name: 'get_component',
    description: 'Everything about one component: classes, modifiers, elements, states, what it is composed of and which tokens it reads (all verified against the compiled CSS), plus hand-written prose: description, usage (example markup) and a11y (role and ARIA the markup needs, keyboard, required JS — read it before writing the HTML).',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'e.g. btn, feature-card, site-header' } },
      required: ['name'],
    },
    run: (a) => syx.getComponent(a),
  },

  {
    name: 'validate_snippet',
    description: 'Runs the contract rules (R01–R04, R09 unknown mixin, R10 exceptions, R11 what a component token may read) over an SCSS snippet BEFORE you write it, and reports tokens it uses that do not exist (`valid`, `violations`, `unknownTokens`). Same engine and contracts/rules.json as npm run validate; an exception is declared with `// syx-allow Rxx: why` on the line above.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'The SCSS to check' },
        path: { type: 'string', description: 'Where it will live. It matters: exceptions depend on the path. Defaults to scss/atoms/_nuevo.scss, the strictest context.' },
      },
      required: ['code'],
    },
    run: (a) => syx.validateSnippet(a),
  },

  {
    name: 'classify_change',
    description: 'Before touching anything: which trust tier changing these files has (automatic, via proposal, or human only) and, for a new token, which file it goes in — deduced from its family, not a table. With no arguments, returns the three tiers and what each covers.',
    inputSchema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Repository-relative paths the change would touch',
        },
        token: {
          type: 'string',
          description: 'A --component-* token you want to create; answers with the file it belongs in',
        },
      },
    },
    run: (a) => syx.classifyChange(a),
  },

  {
    name: 'scan_for_drift',
    description: 'Reads an app\'s markup and styles (.html, .css, .scss, .vue, .svelte, .astro, .jsx, .tsx) and reports where it drifted from the system (`findings`): expired fallbacks, tokens that do not exist, new tokens under SYX prefixes, primitives read by the app, app rules painting SYX classes, hand-written values that are already tokens, classes and modifiers that paint nothing. Changes nothing.',
    inputSchema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' }, description: 'Paths to the files to scan' },
        theme: { type: 'string', description: 'Theme to compare against. Defaults to syx-sketch' },
        mode: { type: 'string', enum: ['light', 'dark'] },
      },
      required: ['files'],
    },
    run: (a) => syx.scan(a),
  },

  {
    name: 'list_mixins',
    description: 'The system mixins with their signature and how often each is used. Mixins only exist in the SCSS — they leave no recognisable trace in the compiled CSS — so this is the only way to know what exists without reading the whole folder.',
    inputSchema: {
      type: 'object',
      properties: { file: { type: 'string', description: 'Filter by file, e.g. positioning or helpers' } },
    },
    run: (a) => syx.listMixins(a),
  },

  {
    name: 'get_mixin',
    description: 'Everything about one mixin: signature, parameters with defaults, which properties it emits, which mixins it calls, who uses it as an alias, and its documented examples. Ask BEFORE writing raw CSS a rule will reject.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'e.g. transition, absolute, size' } },
      required: ['name'],
    },
    run: (a) => syx.getMixin(a),
  },

  {
    name: 'get_figma_spec',
    description: 'A SYX component in the shape the Figma Plugin API understands: each token with its node property (cornerRadius, fills, strokeWeight…), its value already converted — colours as 0–1 RGB, measures in pixels — and its variable name. Ask BEFORE creating anything in Figma: get_component gives token names, and a node needs numbers. It also says what could NOT be translated, and why (`unmapped`, `untranslated`).',
    inputSchema: {
      type: 'object',
      properties: {
        component: { type: 'string', description: 'e.g. btn, feature-card, site-header' },
        theme: { type: 'string', description: 'Defaults to syx-sketch' },
        mode: { type: 'string', enum: ['light', 'dark'], description: 'Defaults to light' },
      },
      required: ['component'],
    },
    run: (a) => syx.getFigmaSpec(a),
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
