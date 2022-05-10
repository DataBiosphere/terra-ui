const { registerTest } = require('./jest-utils')
const { testBillingMembers, testBillingSpendReport, testBillingWorkspaces, testDeleteBillingProject } = require('../tests/billing-projects')


registerTest(testBillingMembers)
registerTest(testBillingSpendReport)
registerTest(testBillingWorkspaces)
registerTest(testDeleteBillingProject)
