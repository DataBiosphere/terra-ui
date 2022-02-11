const _ = require('lodash/fp')
const { checkbox, click, clickable, clickTableCell, findText, noSpinnersAfter, select } = require('../utils/integration-utils')
const { enableDataCatalog, withWorkspace } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const linkDataToWorkspace = async (page, testUrl, token) => {
  await enableDataCatalog(page, testUrl, token)
  await click(page, clickable({ textContains: 'browse & explore' }))
  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  await clickTableCell(page, 'dataset list', 2, 2)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Link to a workspace' })) })
}

const testCatalogFlowFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ billingProject, page, testUrl, token, workspaceName }) => {
  await linkDataToWorkspace(page, testUrl, token)
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

module.exports = {
  linkDataToWorkspace,
  testCatalog
}
