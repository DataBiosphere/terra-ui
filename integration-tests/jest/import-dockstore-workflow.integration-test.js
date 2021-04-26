const { registerTest } = require('./jest-utils')
const { testImportDockstoreWorkflow } = require('../tests/import-dockstore-workflow')


// registerTest(testImportDockstoreWorkflow)
registerTest({ name: 'noop', fn: () => {} })
