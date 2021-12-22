const { registerTest } = require('./jest-utils')
const { testCatalog } = require('../tests/run-catalog-workflow')


registerTest(testCatalog)
