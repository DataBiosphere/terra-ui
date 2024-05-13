import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, join } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
  // Display stories in the "stories" directory before others because
  // we are putting stories related to src/packages in "stories", and we want
  // to particularly encourage reuse of things that are already in published packages.
  stories: [
    'src/stories/Introduction.mdx',
    '../src/stories/**/*.mdx',
    '../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-interactions'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
