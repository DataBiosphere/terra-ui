const { registerTest } = require('./jest-utils')
const { testFindWorkflow } = require('../tests/batch-workflows/find-workflow')


registerTest(testFindWorkflow)
