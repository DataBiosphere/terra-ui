const { registerTest } = require('./jest-utils')
const { testRunNotebook } = require('../tests/run-notebook')


registerTest(testRunNotebook, 1)
