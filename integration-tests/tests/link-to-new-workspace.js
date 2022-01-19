const _ = require('lodash/fp')
const { signIntoTerra, checkbox, click, clickable, clickTableCell, dismissNotifications, fillIn, findText, waitForNoSpinners } = require('../utils/integration-utils')
const { testWorkspaceName } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const testLinkToNewWorkspaceFn = withUserToken(async ({ testUrl, page, token }) => {
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
  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  await clickTableCell(page, "dataset list", 2, 2)
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Link to a workspace' }))
  await waitForNoSpinners(page)

  const newWorkspaceName = testWorkspaceName()
  const newWorkspaceBillingAccount = 'general-dev-billing-account'
  try {
    await click(page, clickable({ textContains: 'Start with a new workspace' }))
    await fillIn(page, '//*[@placeholder="Enter a name"]', `${newWorkspaceName}`)
    await click(page, clickable({ text: 'Select a billing project' }))
    await click(page, clickable({ text: `${newWorkspaceBillingAccount}` }))
    await click(page, clickable({ text: 'Create Workspace' }))
    await waitForNoSpinners(page)
    await page.url().includes(newWorkspaceName)
  } finally {
    await page.evaluate((name, billingProject) => {
        return window.Ajax().Workspaces.workspace(billingProject, name).delete()
      }, `${newWorkspaceName}`, `${newWorkspaceBillingAccount}`)
  }

})

const testLinkToNewWorkspace = {
  name: 'link-to-new-workspace',
  fn: testLinkToNewWorkspaceFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testLinkToNewWorkspace }
