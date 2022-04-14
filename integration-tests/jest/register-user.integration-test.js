const { registerTest } = require('./jest-utils')
const { testRegisterUser } = require('../tests/workspaces/register-user')


registerTest(testRegisterUser)
