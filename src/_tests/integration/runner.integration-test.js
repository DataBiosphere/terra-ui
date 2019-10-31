const basic = require('./basic.puppeteer')
const findWorkflow = require('./find-workflow.puppeteer')
// const importCohortData = require('./import-cohort-data.puppeteer')


jest.setTimeout(60 * 1000)

// test('basic', basic)
test('find workflow', findWorkflow)
// launchTest(importCohortData)
