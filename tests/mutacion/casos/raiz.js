/**
 * Regresión de la fuente raíz: lo que check:raiz debe parar. Se recompila el
 * tema que se toca: el guardián lee css/.
 */

'use strict';

module.exports = [
  {
    id: 'raiz-en-px',
    regresion: 'example-02 vuelve a fijar la fuente raíz en px',
    guardian: 'check:raiz',
    necesita: ['css:example-02'],
    comando: ['node', 'scripts/check-raiz.js'],
    espera: /styles-theme-example-02\.css: --reset-html-font da el tamaño en 14px/,
    mutar: (t) => t.reemplazar('scss/themes/example-02/_theme.scss', '87.5%/1.45', '14px/1.45'),
  },
];
