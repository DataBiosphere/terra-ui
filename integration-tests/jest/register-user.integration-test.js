const { registerTest } = require('./jest-utils')
const { testRegisterUser } = require('../tests/register-user')


registerTest(testRegisterUser)
