const { registerTest } = require('./jest-utils')
const { testImportCohortData } = require('../tests/import-cohort-data')


// registerTest(testImportCohortData)
registerTest({ name: 'noop', fn: () => {} })
