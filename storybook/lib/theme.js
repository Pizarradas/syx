/**
 * Theming compartido por los previews de los tres Storybooks (HTML, React,
 * Vue). La paridad visual entre frameworks exige que los tres carguen el
 * mismo CSS de la misma forma; por eso esto vive una sola vez.
 */

export function makeThemeGlobals(meta) {
  return {
    globalTypes: {
      theme: {
        description: 'Tema SYX',
        toolbar: { title: 'Tema', icon: 'paintbrush', items: meta.themes, dynamicTitle: true },
      },
      mode: {
        description: 'Modo claro/oscuro',
        toolbar: { title: 'Modo', icon: 'mirror', items: meta.darkMode.values, dynamicTitle: true },
      },
    },
    initialGlobals: { theme: meta.defaultTheme, mode: 'light' },
  };
}

export function applyTheme(meta, theme, mode) {
  let link = document.getElementById('syx-theme');
  if (!link) {
    link = document.createElement('link');
    link.id = 'syx-theme';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  // Relativa a propósito: el iframe puede vivir en /, en /storybook/html/ o
  // bajo el server del pixel-diff, y en los tres casos css/ cuelga de su lado.
  const href = meta.cssPattern.replace('<theme>', theme);
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  document.documentElement.setAttribute(meta.darkMode.attribute, mode);
}
