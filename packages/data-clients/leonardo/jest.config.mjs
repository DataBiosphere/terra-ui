import { getJestConfig } from '@terra-ui-packages/test-utils';

export default {
  ...getJestConfig(),
  // Ignore type tests when calculating coverage.
  coveragePathIgnorePatterns: ['\\.types\\.ts$', '\\.errors\\.ts$'],
};
