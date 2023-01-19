const _ = require('lodash/fp')
const { linkDataToWorkspace } = require('../utils/catalog-utils')
const { click, clickable, findText, noSpinnersAfter, select, waitForNoSpinners } = require('../utils/integration-utils')
const { withWorkspace } = require('../utils/integration-helpers')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const testCatalogFlowFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ billingProject, page, testUrl, token, workspaceName }) => {
  await linkDataToWorkspace(page, testUrl, token, 'Readable Catalog Snapshot 1')
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Start with an existing workspace' }))
  await select(page, 'Select a workspace', `${workspaceName}`)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Import' })) })
  await findText(page, `${billingProject}/${workspaceName}`)
  await findText(page, 'Select a data type')
})

registerTest({
  name: 'run-catalog-workflow',
  fn: testCatalogFlowFn,
  timeout: 5 * 60 * 1000
})
