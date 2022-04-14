const { registerTest } = require('./jest-utils')
const { testCatalog } = require('../tests/data-catalog/run-catalog-workflow')


registerTest(testCatalog)
