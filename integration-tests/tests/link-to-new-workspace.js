const { checkbox, click, clickable, clickTableCell, fillIn, noSpinnersAfter, waitForNoSpinners } = require('../utils/integration-utils')
const { checkBucketAccess, enableDataCatalog, testWorkspaceName } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const testLinkToNewWorkspaceFn = withUserToken(async ({ testUrl, page, token }) => {
  await enableDataCatalog(page, testUrl, token)
  await click(page, clickable({ textContains: 'browse & explore' }))

  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  await clickTableCell(page, 'dataset list', 2, 2)
  await click(page, clickable({ textContains: 'Link to a workspace' }))
  await waitForNoSpinners(page)

  const newWorkspaceName = testWorkspaceName()
  const newWorkspaceBillingAccount = 'general-dev-billing-account'
  try {
    await click(page, clickable({ textContains: 'Start with a new workspace' }))
    await fillIn(page, '//*[@placeholder="Enter a name"]', `${newWorkspaceName}`)
    await click(page, clickable({ text: 'Select a billing project' }))
    await click(page, clickable({ text: `${newWorkspaceBillingAccount}` }))
    await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Link to a workspace' })) })
    // Wait for bucket access to avoid sporadic failures
    await checkBucketAccess(page, newWorkspaceBillingAccount, newWorkspaceName)
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
