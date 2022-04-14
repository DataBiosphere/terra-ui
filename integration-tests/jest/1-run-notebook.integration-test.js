const { registerTest } = require('./jest-utils')
const { testRunNotebook } = require('../tests/interactive-analysis/run-notebook')


registerTest(testRunNotebook)
