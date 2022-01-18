const _ = require('lodash/fp')
const { signIntoTerra, checkbox, click, clickable, clickTableCell, findText, waitForNoSpinners } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { dismissNotifications } = require('../utils/integration-utils')


const testRequestAccessFn = _.flow(
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
  await click(page, checkbox({ text: 'Controlled', isDescendant: true }))

  // Request access from the browse & explore page
  await click(page, clickable({ textContains: 'Request Access' }))
  await findText(page, 'Request Access')
  await click(page, clickable({ textContains: 'Close modal' }))

  // Request access from the dataset details page
  await clickTableCell(page, 'dataset list', 2, 2)
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Request Access' }))
  await findText(page, 'Request Access')

})

const testRequestAccess = {
  name: 'request-access',
  fn: testRequestAccessFn,
  timeout: 2 * 60 * 1000,  // 2 min timeout
  targetEnvironments: ['local', 'dev']
}

module.exports = { testRequestAccess }
