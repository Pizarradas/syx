/**
 * SYX — Punto de entrada del paquete
 * ──────────────────────────────────
 * Lo que obtiene una aplicación que hace `require('syx-design-system')`.
 *
 * POR QUÉ EXISTE
 * Hasta ahora `main` apuntaba al CSS de un tema concreto, lo que era un parche
 * y además una mentira: `require()` sobre un fichero .css falla. Peor, dejaba
 * al paquete sin cara programable — una aplicación podía enlazar la hoja de
 * estilos, pero no PREGUNTARLE nada al sistema de diseño.
 *
 * Y esa pregunta es justo la que hace falta para lo que viene: detectar que una
 * aplicación se ha desviado del sistema exige poder comparar lo que la
 * aplicación pinta contra lo que el sistema dice, desde dentro de la aplicación
 * y contra la versión exacta que tiene instalada. De ahí que los contratos
 * viajen con el paquete y no se descarguen de ninguna parte.
 *
 *   const syx = require('syx-design-system');
 *
 *   syx.getToken({ token: '--component-button-primary-filled-bg', mode: 'dark' }).value
 *   syx.findTokenByValue({ value: 'oklch(0.498 0.282 266.24)' }).exactos
 *   syx.getComponent({ name: 'btn' }).modifiers
 *   syx.validateSnippet({ code: '.mi-clase { color: var(--semantic-color-primary); }' })
 *   syx.cssPath('example-03')   // ruta absoluta a la hoja compilada
 *
 * Es la misma capa que sirve el servidor MCP (`npx syx-mcp`), a propósito: un
 * agente y una aplicación deben obtener la misma respuesta a la misma pregunta.
 */

'use strict';

const path = require('path');
const { crearConsulta } = require('./scripts/lib/consulta');

const syx = crearConsulta({ root: __dirname });

module.exports = {
  ...syx,
  version: syx.version,

  // Rutas de los artefactos, para quien prefiera leerlos por su cuenta. Se dan
  // resueltas porque construirlas desde fuera obliga a suponer la estructura
  // interna del paquete, que es exactamente lo que un paquete no debe exigir.
  paths: {
    root: __dirname,
    tokens: path.join(__dirname, 'tokens.json'),
    registry: path.join(__dirname, 'component-registry.json'),
    resolvedTokens: path.join(__dirname, 'contracts', 'resolved-tokens.json'),
    rules: path.join(__dirname, 'contracts', 'rules.json'),
    css: path.join(__dirname, 'css'),
    scss: path.join(__dirname, 'scss'),
    mcpServer: path.join(__dirname, 'scripts', 'mcp-server.js'),
  },
};
