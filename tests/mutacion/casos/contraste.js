/**
 * Regresiones de color en los temas: lo que check:contraste (pares del
 * contrato sobre el CSS compilado) debe parar. Se recompila solo el tema que
 * se toca: el guardián lee css/styles-theme-*.css, no el SCSS.
 */

'use strict';

const CONTRASTE = ['node', 'scripts/check-contraste.js'];

module.exports = [
  {
    id: 'contraste-primario-casi-blanco',
    regresion: 'el primario de example-01 casi blanco',
    guardian: 'check:contraste',
    seEscapaba: true,
    necesita: ['css:example-01'],
    comando: CONTRASTE,
    espera: /❌ example-01/,
    mutar: (t) => t.reemplazar('scss/themes/example-01/_theme.scss',
      /--semantic-color-primary: var\(--primitive-color-blue-500\);/,
      '--semantic-color-primary: oklch(0.97 0.01 277);'),
  },
  {
    id: 'contraste-par-roto',
    regresion: 'un par del contrato roto (texto secundario de syx-sketch claro)',
    guardian: 'check:contraste',
    necesita: ['css:syx-sketch'],
    comando: CONTRASTE,
    espera: /❌ syx-sketch .*texto-secundario/,
    mutar: (t) => t.reemplazar('scss/themes/syx-sketch/_theme.scss',
      '--semantic-color-text-secondary: var(--primitive-color-gray-700);',
      '--semantic-color-text-secondary: var(--primitive-color-gray-400);'),
  },
];
