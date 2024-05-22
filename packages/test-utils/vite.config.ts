import { viteConfig as defineBaseViteConfig } from '@terra-ui-packages/build-utils';
import { defineConfig } from 'vite';

export default defineConfig((env) => {
  const baseConfig = defineBaseViteConfig(env);
  return {
    ...baseConfig,
    build: {
      ...baseConfig.build,
      lib: {
        ...baseConfig.build?.lib,
        entry: [
          'src/index.ts',
          // Since jest.config references setupTests but does not import it,
          // setupTests has to be added as a separate entry point in order
          // for it to be bundled.
          'src/setupTests.ts',
        ],
      },
    },
  };
});
