import { viteConfig as defineBaseViteConfig } from '@terra-ui-packages/build-utils';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig((env) => {
  const baseConfig = defineBaseViteConfig(env);
  return {
    ...baseConfig,
    plugins: [...(baseConfig.plugins || []), svgr()],
  };
});
