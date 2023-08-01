import { baseConfig } from '@terra-ui-packages/test-utils';

export default {
  ...baseConfig,
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '<rootDir>/src/setupTests.ts'],
};
