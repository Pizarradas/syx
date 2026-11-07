/**
 * Regresión de la escala tipográfica: lo que check:escala-tipo debe parar.
 */

'use strict';

module.exports = [
  {
    id: 'escala-tipo-invertida',
    regresion: 'el suelo de 2xl (h3) vuelve a quedar por debajo del de xl (h4) en móvil',
    guardian: 'check:escala-tipo',
    comando: ['node', 'scripts/check-escala-tipo.js'],
    espera: /a 375 px, 2xl \([\d.]+ px\) no es mayor que xl/,
    mutar: (t) => t.reemplazar('scss/abstracts/tokens/primitives/_typography.scss',
      'clamp(1.758rem, 1.603rem + 0.661vw, 2.197rem)', 'clamp(2.1rem, 1.945rem + 0.661vw, 2.197rem)'),
  },
  {
    id: 'escala-tipo-sin-techo',
    regresion: 'un paso fluido que no llega a su máximo a 1440 px',
    guardian: 'check:escala-tipo',
    comando: ['node', 'scripts/check-escala-tipo.js'],
    espera: /3xl: a 1440 px el valor preferente es [\d.]+ px, no el máximo/,
    mutar: (t) => t.reemplazar('scss/abstracts/tokens/primitives/_typography.scss',
      '1.797rem + 1.818vw', '1.797rem + 1.4vw'),
  },
];
