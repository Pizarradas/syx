/**
 * Regresiones en lo que se genera: el CSS commiteado, tokens.json y el
 * paquete publicable. Son las que no se ven leyendo el SCSS, porque el SCSS
 * está bien: lo que miente es lo que se entrega.
 */

'use strict';

module.exports = [
  {
    id: 'css-editado-a-mano',
    regresion: 'CSS compilado editado a mano y commiteado',
    guardian: 'check-limpio --strict',
    necesita: ['git'],
    comando: ['node', 'scripts/check-limpio.js', '--strict'],
    espera: /Compilar cambia/,
    limite: 600,
    mutar: (t) => t.editar('css/styles-theme-example-01.css', (s) => s.replace(/\n?$/, '\n.atom-btn { border-radius: 0; }\n')),
  },
  {
    id: 'token-fuera-de-tokens-json',
    regresion: 'token nuevo en el SCSS que tokens.json no tiene',
    guardian: 'check:tokens-json',
    seEscapaba: true,
    comando: ['node', 'scripts/build-tokens-json.js', '--check'],
    espera: /--component-card-sello-gap/,
    mutar: (t) => t.reemplazar('scss/abstracts/tokens/components/_card.scss', ':root {\n',
      ':root {\n  --component-card-sello-gap: var(--semantic-space-stack-sm);\n'),
  },
  {
    id: 'js-sin-side-effects',
    regresion: 'un js/syx-*.js que `sideEffects` no declara',
    guardian: 'check:package',
    seEscapaba: true,
    comando: ['node', 'scripts/check-package.js'],
    espera: /sideEffects no declara js\/syx-/,
    mutar: (t) => t.json('package.json', (p) => { p.sideEffects = p.sideEffects.filter((x) => !x.includes('js')); }),
  },
];
