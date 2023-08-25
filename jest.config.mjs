import { baseConfig } from '@terra-ui-packages/test-utils';

export default {
  ...baseConfig,
  'reporters': [
    'default',
    ['jest-html-reporter', {
      'pageTitle': 'Test Report',
      'sort': 'status',
      'includeFailureMsg': true,
      'includeSuiteFailure': true,
      "outputPath": "test-report/index.html",
    }]
  ],
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '<rootDir>/src/setupTests.ts'],
};
