/**
 * Regresión de la escala de breakpoints: lo que check:breakpoints debe parar.
 */

'use strict';

module.exports = [
  {
    id: 'breakpoint-literal',
    regresion: 'la rejilla vuelve a escribir su breakpoint a mano (min-screen(50em))',
    guardian: 'check:breakpoints',
    comando: ['node', 'scripts/check-breakpoints.js'],
    espera: /scss\/layout\/grids\/_grid\.scss:\d+ breakpoint literal/,
    mutar: (t) => t.reemplazar('scss/layout/grids/_grid.scss', '@include breakpoint(md)', '@include min-screen(50em)'),
  },
  {
    id: 'breakpoint-literal-en-guia',
    regresion: 'una guía vuelve a enseñar un breakpoint a mano como ejemplo correcto',
    guardian: 'check:breakpoints',
    comando: ['node', 'scripts/check-breakpoints.js'],
    espera: /scss\/GETTING-STARTED\.md:\d+ la guía enseña un breakpoint literal/,
    mutar: (t) => t.reemplazar('scss/GETTING-STARTED.md', '@include breakpoint(md) { … }', '@include min-screen(48em) { … }'),
  },
];
