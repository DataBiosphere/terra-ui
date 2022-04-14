/*
 * File named with "1-" to make Jest start it first, since it's a long-running test.
 * This is most relevant on CI, where the number of simultaneous tests is capped.
 */

const { registerTest } = require('./jest-utils')
const { testRunWorkflow } = require('../tests/batch-workflows/run-workflow')


registerTest(testRunWorkflow)
