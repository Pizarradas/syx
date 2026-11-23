/**
 * Regresiones que el escáner debe ver en un tema: lo que check:escaner para
 * cuando un tema real se sale del contrato de THEMING-RULES.
 */

'use strict';

module.exports = [
  {
    id: 'escaner-tema-componente-primitivo',
    regresion: 'example-03 hace que un --component-* lea un primitivo (R11)',
    guardian: 'check:escaner',
    comando: ['node', 'scripts/check-escaner.js'],
    espera: /❌ tema: la plantilla y los siete temas[\s\S]*example-03 L\d+ primitivo-en-app: --component-x-falso-bg lee --primitive-/,
    mutar: (t) => t.reemplazar('scss/themes/example-03/_theme.scss',
      /(@mixin theme-example-03 \{\n\s*:root \{\n)/,
      '$1    --component-x-falso-bg: var(--primitive-color-coral-500);\n'),
  },
  {
    id: 'vitrina-nombre-sin-texto-visible',
    regresion: 'el enlace a GitHub de la home se anuncia con un nombre que no dice «GitHub» (WCAG 2.5.3)',
    guardian: 'check:vitrina',
    comando: ['npm', 'run', '-s', 'check:vitrina'],
    espera: /se ve «GitHub» y se llama «Open the repository»/,
    mutar: (t) => t.reemplazar('home.html', 'aria-label="GitHub repository"', 'aria-label="Open the repository"'),
  },
  // Fase 2d: un style="…" sobre un elemento de SYX lo pinta. Si el escáner
  // vuelve a saltarse los atributos style, check:escaner tiene que verlo.
  {
    id: 'escaner-style-en-linea',
    regresion: 'el escáner vuelve a saltarse los style="…" sobre elementos de SYX',
    guardian: 'check:escaner',
    comando: ['node', 'scripts/check-escaner.js'],
    espera: /❌ style en línea: pinta un elemento de SYX[\s\S]*esperaba 1, encontró 0/,
    mutar: (t) => t.reemplazar('scripts/lib/escaner.js', "const syxClase = (t.clases || []).find(", 'const syxClase = [].find('),
  },
  // Fase 2d2: el style={{…}} de JSX/TSX. Si el escáner vuelve a no leerlo,
  // check:escaner tiene que verlo.
  {
    id: 'escaner-style-jsx',
    regresion: 'el escáner vuelve a saltarse los style={{…}} de JSX/TSX',
    guardian: 'check:escaner',
    comando: ['node', 'scripts/check-escaner.js'],
    espera: /❌ JSX: style=\{\{…\}\} pinta un elemento de SYX[\s\S]*esperaba 1, encontró 0/,
    mutar: (t) => t.reemplazar('scripts/lib/escaner.js', 'ES_JSX.test(file) || ES_SCRIPT.test(file) ? trozosJsx(bruto)', 'ES_JSX.test(file) || ES_SCRIPT.test(file) ? []'),
  },
  // Fase 2d2 (2.ª parte): los colores propios de la app pasan por contraste.
  // Si el escáner deja de medirlos, check:escaner tiene que verlo.
  {
    id: 'escaner-contraste-app',
    regresion: 'el escáner deja de medir el contraste de los colores propios de la app',
    guardian: 'check:escaner',
    comando: ['node', 'scripts/check-escaner.js'],
    espera: /❌ contraste: los colores propios de la app[\s\S]*encontró nada/,
    mutar: (t) => t.reemplazar('scripts/lib/escaner.js', 'if (razon >= umbral) return;', 'return;'),
  },
];
