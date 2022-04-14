const { registerTest } = require('./jest-utils')
const { testImportCohortData } = require('../tests/workspaces/import-cohort-data')


registerTest(testImportCohortData)
