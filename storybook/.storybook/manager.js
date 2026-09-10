import { addons } from '@storybook/manager-api';
import { syxTheme } from '../lib/brand.js';

addons.setConfig({ theme: syxTheme('HTML') });
