const { registerTest } = require('./jest-utils')
const { testRequestAccess } = require('../tests/request-access')


registerTest(testRequestAccess)
