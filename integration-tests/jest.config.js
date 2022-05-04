module.exports = {
  verbose: false,
  preset: 'jest-puppeteer',
  testRegex: '\\.integration-test\\.js$',
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
