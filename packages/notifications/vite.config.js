import { viteConfig as defineBaseConfig } from '@terra-ui-packages/build-utils';
import { defineConfig } from 'vite';

export default defineConfig((args) => {
  const baseConfig = defineBaseConfig(args)
  return {
    ...baseConfig,
    plugins: [
      ...baseConfig.plugins,
    ]
  }
});
