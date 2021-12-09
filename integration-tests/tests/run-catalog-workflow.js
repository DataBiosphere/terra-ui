const _ = require('lodash/fp')
const { signIntoTerra, click, clickable, waitForNoSpinners } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { dismissNotifications } = require('../utils/integration-utils')


const testCatalogFlowFn = _.flow(
  withUserToken
)(async ({ testUrl, page, token }) => {
  await page.goto(testUrl)
  await waitForNoSpinners(page)

  await page.evaluate(() => window.configOverridesStore.set({ isDataBrowserVisible: true }))
  await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })

  await click(page, clickable({ textContains: 'Browse Data' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)

  await click(page, clickable({ textContains: 'browse & explore' }))
})

const testCatalog = {
  name: 'run-catalog',
  fn: testCatalogFlowFn,
  timeout: 15 * 60 * 1000
}

module.exports = { testCatalog }
