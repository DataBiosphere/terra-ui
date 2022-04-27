module.exports = {
  preset: 'jest-puppeteer',
  testRegex: '\\.integration-test\\.js$',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '/tmp/test-results',
        outputName: 'integration-test-results.xml',
        suiteName: 'Integration tests',
        addFileAttribute: 'true',
        includeConsoleOutput: true
      }
    ]
  ]
}
