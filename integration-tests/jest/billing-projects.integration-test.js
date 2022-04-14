const { registerTest } = require('./jest-utils')
const { testBillingSpendReport } = require('../tests/workspaces/billing-projects')


registerTest(testBillingSpendReport)
