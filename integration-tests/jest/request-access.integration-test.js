const { registerTest } = require('./jest-utils')
const { testRequestAccess } = require('../tests/request-access')
// TODO: Reenable once data catalog supports controlled access datasets
// To turn on:
// 1. uncomment the below line
// 2. rename the .disabled. to be .integration-test.
// 3. add imports
registerTest(testRequestAccess)
