const _ = require('lodash/fp')
const { checkbox, click, clickable, clickTableCell, input, waitForNoSpinners } = require('../utils/integration-utils')
const { enableDataCatalog, withWorkspace } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const testCatalogFlowFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, testUrl, token, workspaceName }) => {
  await enableDataCatalog(page, testUrl, token)
  await click(page, clickable({ textContains: 'browse & explore' }))
  await waitForNoSpinners(page)

  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  await clickTableCell(page, 'dataset list', 2, 2)
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Link to a workspace' }))
  await waitForNoSpinners(page)

  await click(page, clickable({ textContains: 'Start with an existing workspace' }))
  await click(page, input({ labelContains: 'Select a workspace' }))
  await click(page, `//*[@role="combobox"][contains(normalize-space(.), "${workspaceName}")]`)
  await click(page, clickable({ textContains: 'Import' }))
  await waitForNoSpinners(page)
  await page.url().includes(workspaceName)
})

const testCatalog = {
  name: 'run-catalog',
  fn: testCatalogFlowFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testCatalog }
