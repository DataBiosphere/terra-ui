const { registerTest } = require('./jest-utils')
const { googleWorkspaceDashboard, azureWorkspaceDashboard } = require('../tests/workspace-dashboard')


registerTest(googleWorkspaceDashboard)
registerTest(azureWorkspaceDashboard)
