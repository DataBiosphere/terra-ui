import type { Config } from '@jest/types';
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

export const getJestConfig = (): Config.InitialOptions => {
  // Use consistent time zone when testing locally and in CI.
  process.env.TZ = 'UTC';

  const require = createRequire(import.meta.url);
  const testUtilsPath = path.dirname(fileURLToPath(import.meta.url));

  // setupTests has a different file extension depending on whether it's built
  // as an ES module (the default, .js) or as a CommonJS module (.cjs).
  // This returns the path to the setupTests file that is a sibling of this
  // file (jest.config) in the build output.
  const getSetupTestsPath = (): string => {
    const extensions = ['js', 'cjs'];
    for (const ext of extensions) {
      const setupTestsPath = path.resolve(testUtilsPath, `setupTests.${ext}`);
      if (fs.existsSync(setupTestsPath)) {
        return setupTestsPath;
      }
    }

    throw new Error('Unable to locate setupTests');
  };

  const jestConfig: Config.InitialOptions = {
    rootDir: process.cwd(),
    roots: ['<rootDir>/src'],
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts', '!src/**/*.stories.{js,jsx,ts,tsx}'],
    setupFilesAfterEnv: [getSetupTestsPath()],
    testMatch: ['<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}', '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'],
    testEnvironment: 'jsdom',
    transform: {
      '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': path.resolve(testUtilsPath, '../../transforms/babelTransform.cjs'),
      '^.+\\.css$': path.resolve(testUtilsPath, '../../transforms/cssTransform.cjs'),
      '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': path.resolve(testUtilsPath, '../../transforms/fileTransform.cjs'),
    },
    transformIgnorePatterns: [],
    modulePaths: [],
    moduleNameMapper: {
      '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
      '^src/(.*)$': '<rootDir>/src/$1',
    },
    watchPlugins: [require.resolve('jest-watch-typeahead/filename'), require.resolve('jest-watch-typeahead/testname')],
    resetMocks: false,
    clearMocks: true,
  };

  return jestConfig;
};
