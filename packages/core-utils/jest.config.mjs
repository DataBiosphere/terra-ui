// ESLint thinks @terra-ui-packages/test-utils should be listed in dependencies instead of devDependencies.
// TODO: Fix this in ESLint configuration.
// eslint-disable-next-line import/no-extraneous-dependencies
import { baseConfig } from '@terra-ui-packages/test-utils';

export default {
  ...baseConfig,
  // Ignore type tests when calculating coverage.
  coveragePathIgnorePatterns: ['\\.types\\.ts$', '\\.errors\\.ts$'],
};
