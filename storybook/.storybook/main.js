/** Configuración Storybook del sandbox de portabilidad SYX (renderer HTML). */
export default {
  framework: { name: '@storybook/html-vite', options: {} },
  addons: ['@storybook/addon-essentials'],
  // docs/ es contenido escrito (bienvenida); stories/ es todo generado.
  stories: ['../docs/**/*.mdx', '../stories/**/*.stories.js'],
  // El CSS compilado referencia las fuentes como ../fonts/..., así que se
  // sirven css/ y fonts/ del repo con la misma relación de rutas.
  staticDirs: [
    { from: '../../css', to: '/css' },
    { from: '../../fonts', to: '/fonts' },
  ],
};
