import { createRequire } from 'module';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

// Use consistent time zone when testing locally and in CI.
process.env.TZ = 'UTC';

const require = createRequire(import.meta.url);
const testUtilsPath = path.dirname(fileURLToPath(import.meta.url));

export default {
  rootDir: process.cwd(),
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  setupFilesAfterEnv: [path.resolve(testUtilsPath, 'setupTests.mjs')],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}', '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': path.resolve(testUtilsPath, 'transforms/babelTransform.cjs'),
    '^.+\\.css$': path.resolve(testUtilsPath, 'transforms/cssTransform.cjs'),
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': path.resolve(testUtilsPath, 'transforms/fileTransform.cjs'),
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
