/**
 * Regresiones de autoría en el SCSS de los componentes: lo que el motor de
 * reglas (R01–R04, R09, R10, vía `validate`) y stylelint deben parar.
 *
 * Las inyecciones se escriben como las escribiría alguien con prisa, no como
 * las espera el guardián: sin espacio tras los dos puntos, en una sola línea,
 * dentro de una regla anidada. Las evasiones de formato son justo las que se
 * colaban antes de que las reglas se comprobaran sobre el AST.
 */

'use strict';

const VALIDATE = ['node', 'scripts/syx-validate.js'];
const COMPILADO = ['node', 'scripts/check-compilado.js', '--entrada', 'scss/styles-theme-syx-sketch.scss'];
// _pill.scss tiene finales CRLF: el ancla no incluye el salto de línea.
const PILL = ['scss/atoms/_pill.scss', '    .atom-pill {'];
const TEMA = ['scss/themes/syx-sketch/_theme.scss', '  --component-button-secondary-color: var(--semantic-color-secondary-strong);\n'];
/** Inyecta `codigo` justo después de la línea ancla. */
const tras = ([fichero, ancla], codigo) => (t) => t.reemplazar(fichero, ancla, ancla + (ancla.endsWith('\n') ? '' : '\n') + codigo);

const LINT = ['node', 'node_modules/stylelint/bin/stylelint.mjs', 'scss/**/*.scss', '--config', '.stylelintrc.json'];

module.exports = [
  {
    id: 'r03-transicion-compacta',
    regresion: '`transition:opacity .2s` sin espacio, en una línea, en un átomo',
    guardian: 'validate (R03)',
    seEscapaba: true,
    comando: VALIDATE,
    espera: /R03/,
    mutar: (t) => t.reemplazar('scss/atoms/_link.scss', '  .atom-link {\n', '  .atom-link {\n    &__aviso{transition:opacity .2s}\n'),
  },
  {
    id: 'r04-absolute-molecula',
    regresion: '`position:absolute` en una molécula',
    guardian: 'validate (R04)',
    comando: VALIDATE,
    espera: /R04/,
    mutar: (t) => t.reemplazar('scss/molecules/_card.scss', '    .mol-card {\n', '    .mol-card {\n      &__sello { position:absolute; inset-block-start: 0; }\n'),
  },
  {
    id: 'r01-primitivo-atomo',
    regresion: '`var(--primitive-…)` en un átomo',
    guardian: 'validate (R01)',
    comando: VALIDATE,
    espera: /R01/,
    mutar: (t) => t.reemplazar('scss/atoms/_link.scss', '  .atom-link {\n', '  .atom-link {\n    color: var(--primitive-color-blue-500);\n'),
  },
  {
    id: 'r01-primitivo-pill',
    regresion: '`var(--primitive-…)` en _pill.scss (antes exceptuado entero)',
    guardian: 'validate (R01)',
    seEscapaba: true,
    comando: VALIDATE,
    espera: /R01/,
    mutar: (t) => t.reemplazar('scss/atoms/_pill.scss', '.atom-pill {', '.atom-pill { outline-color: var(--primitive-color-gray-300);'),
  },
  {
    id: 'r09-mixin-inexistente',
    regresion: '`@include` de un mixin que no existe',
    guardian: 'validate (R09)',
    seEscapaba: true,
    comando: VALIDATE,
    espera: /R09/,
    mutar: (t) => t.reemplazar('scss/atoms/_link.scss', '  .atom-link {\n', '  .atom-link {\n    @include focus-anillo();\n'),
  },
  {
    id: 'r10-excepcion-muerta',
    regresion: 'una excepción `// syx-allow` que ya no excusa nada',
    guardian: 'validate (R10)',
    seEscapaba: true,
    comando: VALIDATE,
    espera: /R10/,
    mutar: (t) => t.reemplazar('scss/molecules/_card.scss', '    .mol-card {\n',
      '    .mol-card {\n      // syx-allow R04: la tarjeta necesitaba un sello posicionado encima\n      isolation: isolate;\n'),
  },
  {
    id: 'lint-hex-atomo',
    regresion: 'un color hex literal en un átomo',
    guardian: 'lint (color-no-hex)',
    seEscapaba: true,
    comando: LINT,
    espera: /color-no-hex/,
    mutar: (t) => t.reemplazar('scss/atoms/_link.scss', '  .atom-link {\n', '  .atom-link {\n    &--marca { color: #6d28d9; }\n'),
  },
  {
    id: 'lint-px-atomo',
    regresion: 'una medida en px literal en un átomo',
    guardian: 'lint (unit-disallowed-list)',
    seEscapaba: true,
    comando: LINT,
    espera: /unit-disallowed-list/,
    mutar: (t) => t.reemplazar('scss/atoms/_link.scss', '  .atom-link {\n', '  .atom-link {\n    &--marca { padding-inline: 12px; }\n'),
  },
  {
    id: 'r11-componente-lee-primitivo',
    regresion: 'un token de componente que apunta a un primitivo (la píldora violeta en un tema cian)',
    guardian: 'validate (R11)',
    seEscapaba: true,
    comando: VALIDATE,
    espera: /R11/,
    mutar: (t) => t.reemplazar('scss/abstracts/tokens/components/_pills.scss', '  --component-pill-primary-bg: var(--semantic-color-tone-primary-subtle-bg);', '  --component-pill-primary-bg: var(--primitive-color-purple-100);'),
  },
  {
    id: 'tema-declaracion-sin-lector',
    regresion: 'un tema declara una variable que nada lee (como el --btn-primary-filled-text de example-06)',
    guardian: 'check:consumidores',
    seEscapaba: true,
    comando: ['node', 'scripts/check-consumidores.js'],
    espera: /--btn-primary-filled-text/,
    mutar: (t) => t.reemplazar('scss/themes/example-06/_theme.scss', '        --semantic-color-primary: var(--primitive-color-cyan-500);\n', '        --semantic-color-primary: var(--primitive-color-cyan-500);\n        --btn-primary-filled-text: var(--semantic-color-text-primary);\n'),
  },
  {
    id: 'plantilla-sin-oscuro',
    regresion: 'la plantilla de tema pierde su modo oscuro',
    guardian: 'check:plantilla',
    seEscapaba: true,
    comando: ['node', 'scripts/check-plantilla.js'],
    espera: /no oscurece/,
    mutar: (t) => t.reemplazar('scss/themes/_template/_theme.scss', '      @include dark-mode-tokens();\n', ''),
  },
  // ─── Sass evaluado: lo que el fuente disfraza y el CSS emitido no ─────────
  // Auditoría 2026-10 II: los ocho pasaban toda la cadena. check:compilado
  // aplica las reglas a lo que Sass emite y decide el permiso por el origen
  // de cada declaración (mapa de fuentes).
  {
    id: 'compilado-r01-interpolado',
    regresion: "`var(--#{'primitive'}-…)`: el primitivo se arma con interpolación",
    guardian: 'check:compilado (R01)',
    seEscapaba: true,
    comando: COMPILADO,
    espera: /R01 scss\/atoms\/_pill\.scss/,
    mutar: tras(PILL, "    color: var(--#{'primitive'}-color-red-500);\n"),
  },
  {
    id: 'compilado-r01-each',
    regresion: 'un mapa recorrido con `@each` que emite primitivos',
    guardian: 'check:compilado (R01)',
    seEscapaba: true,
    comando: COMPILADO,
    espera: /R01 scss\/atoms\/_pill\.scss/,
    mutar: tras(PILL, "    $mapa-x: (a: 'primitive-color-red-500');\n    @each $k, $v in $mapa-x { border-color: var(--#{$v}); }\n"),
  },
  {
    id: 'compilado-r03-interpolado',
    regresion: "`#{'transition'}: …`: la propiedad interpolada",
    guardian: 'check:compilado (R03)',
    seEscapaba: true,
    comando: COMPILADO,
    espera: /R03 scss\/atoms\/_pill\.scss/,
    mutar: tras(PILL, "    #{'transition'}: opacity 1s;\n"),
  },
  {
    id: 'compilado-r04-variable',
    regresion: '`position: $p` con `$p: sticky`',
    guardian: 'check:compilado (R04)',
    seEscapaba: true,
    comando: COMPILADO,
    espera: /R04 scss\/atoms\/_pill\.scss/,
    mutar: tras(PILL, '    $p-x: sticky;\n    position: $p-x;\n'),
  },
  {
    id: 'compilado-r02-interpolado',
    regresion: "`#{'!important'}` interpolado (stylelint tampoco lo ve)",
    guardian: 'check:compilado (R02)',
    seEscapaba: true,
    comando: COMPILADO,
    espera: /R02 scss\/atoms\/_pill\.scss/,
    mutar: tras(PILL, "    outline-color: red #{'!important'};\n"),
  },
  {
    id: 'compilado-r11-nombre',
    regresion: 'un `--component-*` con un color con nombre (`rebeccapurple`) en un átomo',
    guardian: 'check:compilado (R11)',
    seEscapaba: true,
    comando: COMPILADO,
    espera: /R11 scss\/atoms\/_pill\.scss/,
    mutar: tras(PILL, '    --component-pill-x: rebeccapurple;\n'),
  },
  {
    id: 'compilado-r11-relativo',
    regresion: '`oklch(from var(--semantic-…) 0.55 0.25 300)`: lee un token pero fija los tres canales',
    guardian: 'check:compilado (R11)',
    seEscapaba: true,
    comando: COMPILADO,
    espera: /R11 scss\/atoms\/_pill\.scss/,
    mutar: tras(PILL, '    --component-pill-x: oklch(from var(--semantic-color-primary) 0.55 0.25 300);\n'),
  },
  {
    id: 'compilado-r11-tema',
    regresion: "`var(#{'--primitive-…'})` en un override de componente del tema",
    guardian: 'check:compilado (R11)',
    seEscapaba: true,
    comando: COMPILADO,
    espera: /R11 scss\/themes\/syx-sketch\/_theme\.scss/,
    mutar: tras(TEMA, "  --component-pill-x: var(#{'--primitive-color-red-500'});\n"),
  },
];
