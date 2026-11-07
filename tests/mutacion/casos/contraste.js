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
  {
    id: 'contraste-sin-respaldo',
    regresion: 'example-06 sin tintas de respaldo (navegador sin color relativo)',
    guardian: 'check:contraste',
    necesita: ['css:example-06'],
    comando: CONTRASTE,
    espera: /❌ example-06 .*sin color relativo/,
    mutar: (t) => t.reemplazar('scss/themes/example-06/_tintas-respaldo.scss',
      /@mixin tintas-respaldo \{[\s\S]*\}\s*$/,
      '@mixin tintas-respaldo {\n}\n'),
  },
  {
    id: 'respaldo-desfasado',
    regresion: 'el primario de example-06 cambia y su respaldo no se regenera',
    guardian: 'check:tintas-respaldo',
    necesita: ['css:example-06'],
    comando: ['node', 'scripts/build-tintas-respaldo.js', '--check'],
    espera: /example-06\/_tintas-respaldo\.scss está desfasado/,
    mutar: (t) => t.reemplazar('scss/themes/example-06/_theme.scss',
      '--semantic-color-primary: var(--primitive-color-cyan-500);',
      '--semantic-color-primary: var(--primitive-color-violet-500);'),
  },
];
