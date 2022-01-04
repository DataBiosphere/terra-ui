const _ = require('lodash/fp')
const { signIntoTerra, click, clickable, waitForNoSpinners, findText } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { dismissNotifications } = require('../utils/integration-utils')

const findWorkflowButton = clickable({ textContains: 'Find a Workflow' })

const testCatalogFlowFn = _.flow(
  withUserToken
)(async ({ testUrl, page, token }) => {
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
  await findText(page, 'All datasets')
  await click(page, '//*[@role="table" and @aria-label="dataset list"]//*[@role="cell"][1]//ancestor::*[@role="row"]')

})

const testCatalog = {
  name: 'run-catalog',
  fn: testCatalogFlowFn,
  timeout: 2 * 60 * 1000
}

module.exports = { testCatalog }
