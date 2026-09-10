/**
 * Marca compartida del manager (la UI exterior: sidebar, toolbar, cabecera).
 * Un solo lugar para los tres catálogos; cada uno pasa su apellido.
 * No hay logo bitmap en el repo, así que la marca es tipográfica: SYX.
 */
import { create } from '@storybook/theming';

export function syxTheme(flavor) {
  return create({
    base: 'light',
    brandTitle: `SYX · ${flavor}`,
    brandUrl: 'https://pizarradas.github.io/syx/storybook/',
    brandTarget: '_self',
    fontBase: 'system-ui, sans-serif',
    fontCode: 'ui-monospace, "Cascadia Code", Consolas, monospace',
    colorPrimary: '#1a1a1a',
    colorSecondary: '#3b5bdb',
    appBorderRadius: 6,
  });
}

// El orden del árbol lateral (Introducción, Tokens, Atoms, Molecules,
// Organisms) vive inline en cada preview.js: el indexador de Storybook exige
// que options.storySort sea analizable estáticamente y rechaza un import.
