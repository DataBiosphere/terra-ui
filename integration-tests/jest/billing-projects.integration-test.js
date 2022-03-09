const { registerTest } = require('./jest-utils')
const { testBillingSpendReport } = require('../tests/billing-projects')


registerTest(testBillingSpendReport)
