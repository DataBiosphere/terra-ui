const { registerTest } = require('./jest-utils')
const { janitor } = require('../tests/workspaces/janitor')


registerTest(janitor)
