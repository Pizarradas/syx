/**
 * Regresiones en el `usage` del registro: el ejemplo canónico de cada
 * componente, que docs.html pinta, el arnés de navegador monta y un agente
 * copia. Antes de check:usage pasaban la cadena entera: check:registry solo
 * miraba que la prosa se conservara al regenerar, no lo que decía.
 */

'use strict';

const USAGE = ['node', 'scripts/check-usage.js'];
const enUsage = (t, nombre, fn) => t.json('component-registry.json', (r) => {
  const c = ['atoms', 'molecules', 'organisms'].flatMap((k) => r[k]).find((x) => x.name === nombre);
  if (!c) throw new Error(`el registro ya no tiene ${nombre}`);
  const antes = c.usage;
  c.usage = fn(c.usage);
  if (c.usage === antes) throw new Error(`la mutación no cambió el usage de ${nombre}`);
});

module.exports = [
  {
    id: 'usage-clase-inventada',
    regresion: '`usage` con una clase inventada',
    guardian: 'check:usage',
    seEscapaba: true,
    comando: USAGE,
    espera: /atom-btn--fantasma/,
    mutar: (t) => enUsage(t, 'btn', (u) => u.replace('class="atom-btn', 'class="atom-btn atom-btn--fantasma')),
  },
  {
    id: 'usage-etiqueta-sin-cerrar',
    regresion: '`usage` con una etiqueta sin cerrar',
    guardian: 'check:usage',
    seEscapaba: true,
    comando: USAGE,
    espera: /sin cerrar|llega con/,
    mutar: (t) => enUsage(t, 'card', (u) => u.replace('</header>', '')),
  },
];
