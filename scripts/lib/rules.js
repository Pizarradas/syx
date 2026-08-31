/**
 * SYX — Reglas de contrato R01–R04
 * ────────────────────────────────
 * Vive aquí y no dentro de `syx-validate.js` porque lo usan dos: el validador,
 * que las pasa sobre el repositorio entero, y el servidor MCP, que las pasa
 * sobre un fragmento ANTES de que un agente lo escriba.
 *
 * Esa diferencia es el punto: hasta ahora un agente escribía y después alguien
 * validaba. Con las mismas reglas disponibles antes de escribir, el fragmento
 * llega ya conforme — y, sobre todo, con el mismo criterio, porque tener dos
 * copias de estas reglas habría garantizado que acabaran diciendo cosas
 * distintas.
 */

'use strict';

// Rutas donde SÍ se pueden usar primitivos: son las capas que los definen o los
// traducen, no las que los consumen.
const R01_PERMITIDO = [
  'scss/abstracts/',
  'scss/themes/',
  'scss/base/',
  'scss/setup-builder.scss',
  'scss/setup.scss',
  'scss/utilities/',
  'scss/pages/',
  'scss/organisms/_home-tokens.scss',
];

// Excepciones por patrón deliberado, no por descuido.
const R01_EXCEPCIONES = [
  'scss/atoms/_feature-icon.scss',
  'scss/atoms/_pill.scss',
  'scss/molecules/_code-snippet.scss',
  'scss/organisms/_home-layers.scss',
];
const R03_EXCEPCIONES = ['mixins/', 'scss/utilities/_accessibility.scss', 'scss/base/_reset.scss'];
const R04_EXCEPCIONES = [
  'mixins/', 'scss/base/_reset.scss', 'scss/utilities/_accessibility.scss',
  'scss/utilities/_display.scss',
  'scss/organisms/_home-tokens.scss',
];

const DESCRIPCIONES = {
  R01: 'Un componente no usa --primitive-* directamente: pasa por --semantic-*',
  R02: 'Sin !important — la cascada se gobierna con @layer',
  R03: 'Sin `transition:` en crudo — usa el mixin transition()',
  R04: 'Sin `position: absolute|fixed|sticky` en crudo — usa los mixins de posición',
};

const permitidoR01 = (rel) =>
  R01_PERMITIDO.some((p) => rel.startsWith(p) || rel === p.replace(/\/$/, '')) ||
  R01_EXCEPCIONES.some((p) => rel.endsWith(p.replace(/^scss\//, '')));

/**
 * Pasa R01–R04 sobre UN fichero (real o imaginario).
 * `rel` importa: las excepciones dependen de dónde vaya a vivir el código.
 */
function revisar(rel, contenido) {
  const violaciones = { R01: [], R02: [], R03: [], R04: [] };
  const lineas = String(contenido).split('\n');

  lineas.forEach((linea, i) => {
    const t = linea.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    const n = i + 1;

    if (!permitidoR01(rel) && /var\(--primitive-/.test(linea)) {
      violaciones.R01.push({ file: rel, line: n, content: t });
    }
    if (/!important/.test(linea)) {
      violaciones.R02.push({ file: rel, line: n, content: t });
    }
    if (!R03_EXCEPCIONES.some((p) => rel.includes(p)) && /^\s+transition:\s/.test(linea)) {
      violaciones.R03.push({ file: rel, line: n, content: t });
    }
    if (!R04_EXCEPCIONES.some((p) => rel.includes(p)) &&
        /^\s+position:\s+(absolute|fixed|sticky)/.test(linea)) {
      violaciones.R04.push({ file: rel, line: n, content: t });
    }
  });

  return violaciones;
}

// Sobre una lista de ficheros, agregando.
function revisarTodos(ficheros) {
  const total = { R01: [], R02: [], R03: [], R04: [] };
  for (const { rel, content } of ficheros) {
    const v = revisar(rel, content);
    for (const k of Object.keys(total)) total[k].push(...v[k]);
  }
  return total;
}

/**
 * Los tokens que un fragmento usa y que no existen.
 *
 * No es una regla numerada, pero es la comprobación que más falta hacía: el
 * registro de componentes llegó a tener 81 de 111 tokens con nombres que no
 * existían, y nada lo detectaba porque R05 y R06 comparan DECLARACIONES contra
 * tokens.json, nunca el CONSUMO contra las declaraciones.
 */
function tokensInexistentes(contenido, conocidos) {
  const usados = new Set(
    [...String(contenido).matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map((m) => m[1])
  );
  const fuera = [];
  for (const t of usados) {
    if (conocidos.has(t)) continue;
    // Con fallback no rompe: `var(--x, algo)` pinta `algo`.
    const conFallback = new RegExp(`var\\(\\s*${t}\\s*,`).test(contenido);
    fuera.push({ token: t, conFallback });
  }
  return fuera.sort((a, b) => a.token.localeCompare(b.token));
}

module.exports = { revisar, revisarTodos, tokensInexistentes, DESCRIPCIONES };
