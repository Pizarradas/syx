/** Storybook Vue 3 del sandbox de portabilidad SYX. */
import { mergeConfig } from 'vite';

export default {
  framework: { name: '@storybook/vue3-vite', options: {} },
  addons: ['@storybook/addon-essentials'],
  stories: ['../stories/**/*.stories.js'],
  staticDirs: [
    { from: '../../../../css', to: '/css' },
    { from: '../../../../fonts', to: '/fonts' },
  ],
  viteFinal: (config) =>
    mergeConfig(config, {
      // El preview importa spec y theming desde storybook/ (dos niveles por
      // encima del root de Vite); en dev el fs-allow por defecto lo bloquearía.
      server: { fs: { allow: ['../../..'] } },
    }),
};
