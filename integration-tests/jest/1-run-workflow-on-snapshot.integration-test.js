const { registerTest } = require('./jest-utils')
const { testRunWorkflowOnSnapshot } = require('../tests/run-workflow-on-snapshot')


registerTest(testRunWorkflowOnSnapshot, 1)
