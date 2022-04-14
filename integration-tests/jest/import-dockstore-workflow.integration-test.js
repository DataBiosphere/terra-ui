const { registerTest } = require('./jest-utils')
const { testImportDockstoreWorkflow } = require('../tests/batch-workflows/import-dockstore-workflow')


registerTest(testImportDockstoreWorkflow)
