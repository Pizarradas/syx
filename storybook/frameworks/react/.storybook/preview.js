import spec from '../../../spec/spec.json';
import { makeThemeGlobals, applyTheme } from '../../../lib/theme.js';

export default {
  ...makeThemeGlobals(spec._meta),
  decorators: [
    (story, ctx) => {
      applyTheme(spec._meta, ctx.globals.theme, ctx.globals.mode);
      return story();
    },
  ],
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    options: { storySort: { order: ['Introducción', 'Tokens', 'Atoms', 'Molecules', 'Organisms'] } },
  },
};
