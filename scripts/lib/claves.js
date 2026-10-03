/**
 * SYX — Claves públicas en inglés
 * ───────────────────────────────
 * Las consultas (`index.js`, el servidor MCP, `syx-scan --json`) devolvían
 * claves en español —`encontrado`, `exactos`, `hallazgos`— dentro de una API
 * que por lo demás está en inglés (`getToken`, `value`, `modifiers`). Un agente
 * que lee `found` en un sitio y `encontrado` en otro mezcla los dos y acaba
 * escribiendo el que no es. Desde la 5.1 la superficie pública está en inglés.
 *
 * CÓMO
 * El código interno sigue hablando español —es el idioma de trabajo del
 * repositorio— y la traducción se hace UNA vez, en la frontera: `aIngles()`
 * recorre la respuesta y renombra las claves de este diccionario. Solo las
 * claves: los textos (descripciones, motivos, la gravedad `alta|media|baja`)
 * no cambian, y las claves que son datos —`R03` en `violations`, `primary` en
 * `variants`, `media` en `bySeverity`— no están en el diccionario y pasan tal
 * cual.
 *
 * COMPATIBILIDAD
 * Cada objeto traducido conserva su nombre anterior como alias NO enumerable:
 * `require('syx-design-system').getToken(...).encontrado` sigue funcionando en
 * la API de Node, pero no aparece en `JSON.stringify`, así que el MCP y
 * `syx-scan --json` responden solo en inglés. Los alias se retiran en la 6.0.
 */
'use strict';

const CLAVES = {
  // getToken · findTokenByValue · listThemes
  encontrado: 'found',
  sugerencias: 'suggestions',
  esExpresion: 'isExpression',
  sinValor: 'unresolved',
  cadena: 'chain',
  declarado: 'declared',
  exactos: 'exact',
  parciales: 'partial',
  tokensPorTema: 'tokensPerTheme',
  // getFigmaSpec
  clases: 'classes',
  modificadores: 'modifiers',
  estados: 'states',
  propiedades: 'properties',
  propiedad: 'property',
  tipo: 'type',
  valor: 'value',
  variante: 'variant',
  estado: 'state',
  variantes: 'variants',
  sinPropiedad: 'unmapped',
  sinTraducir: 'untranslated',
  motivo: 'reason',
  inferencia: 'inference',
  // validateSnippet
  conforme: 'valid',
  violaciones: 'violations',
  regla: 'rule',
  severidad: 'severity',
  casos: 'cases',
  recambio: 'replacement',
  ejemplo: 'example',
  sintaxis: 'syntaxError',
  excepciones: 'exceptions',
  porque: 'why',
  tokensInexistentes: 'unknownTokens',
  conFallback: 'hasFallback',
  nota: 'note',
  // classifyChange
  contrato: 'contract',
  principio: 'principle',
  cambio: 'change',
  manda: 'decidedBy',
  detalle: 'detail',
  patron: 'pattern',
  porDefecto: 'isDefault',
  fuera: 'outside',
  destino: 'destination',
  resuelto: 'resolved',
  fichero: 'file',
  vecino: 'neighbour',
  segmentosComunes: 'sharedSegments',
  familia: 'family',
  nivelDelDestino: 'destinationTier',
  niveles: 'tiers',
  // scan
  ficheros: 'files',
  porTipo: 'byType',
  porGravedad: 'bySeverity',
  hallazgos: 'findings',
  gravedad: 'severity',
  linea: 'line',
  que: 'what',
  sugerencia: 'suggestion',
  ignorados: 'ignored',
  tipos: 'types',
};

/** La misma respuesta con las claves públicas en inglés y alias no enumerables con las de antes. */
function aIngles(x) {
  if (Array.isArray(x)) return x.map(aIngles);
  if (!x || typeof x !== 'object') return x;
  const fuera = {};
  const alias = [];
  for (const [k, v] of Object.entries(x)) {
    const en = CLAVES[k];
    // Si la respuesta ya trae la clave inglesa (getComponent mezcla `modifiers`
    // del registro con nada más), gana la que ya estaba.
    if (en && !(en in x)) {
      fuera[en] = aIngles(v);
      alias.push([k, en]);
    } else {
      fuera[k] = aIngles(v);
    }
  }
  for (const [es, en] of alias) {
    Object.defineProperty(fuera, es, { get() { return this[en]; }, enumerable: false, configurable: true });
  }
  return fuera;
}

module.exports = { CLAVES, aIngles };
