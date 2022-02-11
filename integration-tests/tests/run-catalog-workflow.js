const _ = require('lodash/fp')
const { click, clickable, findText, noSpinnersAfter, select } = require('../utils/integration-utils')
const { enableDataCatalog, goToLinkWorkspacePage, withWorkspace } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const testCatalogFlowFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, testUrl, token, workspaceName, billingProject }) => {
  await enableDataCatalog(page, testUrl, token)
  await goToLinkWorkspacePage(page)
  await click(page, clickable({ textContains: 'Start with an existing workspace' }))
  await select(page, 'Select a workspace', `${workspaceName}`)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Import' })) })
  await findText(page, `${billingProject}/${workspaceName}`)
  await findText(page, 'Select a data type')
})

const testCatalog = {
  name: 'run-catalog',
  fn: testCatalogFlowFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testCatalog }
