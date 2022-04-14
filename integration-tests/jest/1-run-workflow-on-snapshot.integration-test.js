const { registerTest } = require('./jest-utils')
const { testRunWorkflowOnSnapshot } = require('../tests/workspaces/run-workflow-on-snapshot')


registerTest(testRunWorkflowOnSnapshot)
