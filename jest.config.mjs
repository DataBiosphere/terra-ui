import { baseConfig } from '@terra-ui-packages/test-utils';

export default {
  ...baseConfig,
  'reporters': [
    'default',
    ['jest-html-reporter', {
      'pageTitle': 'Test Report'
    }]
  ],
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '<rootDir>/src/setupTests.ts'],
};
