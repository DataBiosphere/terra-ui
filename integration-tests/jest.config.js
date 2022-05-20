module.exports = {
  verbose: false,
  preset: 'jest-puppeteer',
  testEnvironment: '<rootDir>/jest-circus-environment.js',
  testMatch: ['<rootDir>/tests/*.js'],
  reporters: [
    'default',
    '<rootDir>/jest-reporter.js',
    [
      'jest-junit',
      {
        suiteName: 'Integration tests',
        addFileAttribute: 'true',
        includeConsoleOutput: true
      }
    ]
  ]
}
