const _ = require('lodash/fp')
const { signIntoTerra, click, clickable, clickTableCell, findText, input, waitForNoSpinners } = require('../utils/integration-utils')
const { withWorkspace } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')
const { dismissNotifications } = require('../utils/integration-utils')


const testCatalogFlowFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ testUrl, page, token, workspaceName }) => {
  await page.goto(testUrl)
  await waitForNoSpinners(page)

  await findText(page, 'Browse Data')

  await page.evaluate(() => window.configOverridesStore.set({ isDataBrowserVisible: true }))
  await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })

  await click(page, clickable({ textContains: 'Browse Data' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)

  await click(page, clickable({ textContains: 'browse & explore' }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Granted' }))
  await clickTableCell(page, "dataset list", 2, 2)
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Link to a workspace' }))
  await waitForNoSpinners(page)

  await click(page, clickable({ textContains: 'Start with a new workspace' }))
  await findText(page, 'Create a New Workspace')
  await click(page, clickable({ textContains: 'Cancel' }))

  await click(page, clickable({ textContains: 'Start with an existing workspace' }))
  await click(page, input({ labelContains: 'Select a workspace' }))
  await click(page, `//*[@role="combobox"][contains(normalize-space(.), "${workspaceName}")]`)
  await click(page, clickable({ textContains: 'Import' }))
})

const testCatalog = {
  name: 'run-catalog',
  fn: testCatalogFlowFn,
  timeout: 2 * 60 * 1000
}

module.exports = { testCatalog }
