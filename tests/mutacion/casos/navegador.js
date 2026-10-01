/**
 * Regresiones que solo se ven en un navegador. Necesitan Chromium (SYX_CHROMIUM
 * o el de Playwright) y las dependencias de tests/browser; con
 * --sin-navegador se saltan.
 */

'use strict';

module.exports = [
  {
    id: 'foco-outline-none',
    regresion: 'un componente sin foco visible (`outline: none` sin sustituto)',
    guardian: 'foco.mjs (navegador)',
    seEscapaba: true,
    necesita: ['navegador', 'css:syx-sketch'],
    comando: ['node', 'tests/browser/foco.mjs', '--temas', 'syx-sketch', '--solo-foco'],
    espera: /❌ btn · button\.atom-btn[^\n]*· foco/,
    mutar: (t) => t.reemplazar('scss/atoms/_btn.scss',
      /(&:focus-visible \{\s*\/\/ &:not\(:disabled\)\s*&:not\(:disabled\) \{\s*)@include focus-ring\(\);/,
      '$1outline: none;'),
  },
  {
    id: 'hidden-sin-important',
    regresion: '`[hidden]` vuelve a perder frente al display de los componentes (sin el !important de la capa reset)',
    guardian: 'oculto.mjs (navegador)',
    seEscapaba: true,
    necesita: ['navegador', 'css:syx-sketch'],
    comando: ['node', 'tests/browser/oculto.mjs'],
    espera: /❌ css\/styles-theme-syx-sketch\.css/,
    mutar: (t) => t.reemplazar('scss/base/_hidden.scss',
      /\s*\/\/ stylelint-disable-next-line[^\n]*\n(\s*)display: none !important;/,
      '\n$1display: none;'),
  },
];
