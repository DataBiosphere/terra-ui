const { registerTest } = require('./jest-utils')
const { testBillingMembers, testBillingSpendReport, testBillingWorkspaces } = require('../tests/billing-projects')


registerTest(testBillingMembers)
registerTest(testBillingSpendReport)
registerTest(testBillingWorkspaces)
