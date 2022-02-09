const { checkbox, click, clickable, clickTableCell, fillIn, findText, noSpinnersAfter, select, waitForNoSpinners } = require('../utils/integration-utils')
const { checkBucketAccess, enableDataCatalog, testWorkspaceName } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const testLinkToNewWorkspaceFn = withUserToken(async ({ testUrl, page, token }) => {
  await enableDataCatalog(page, testUrl, token)
  await click(page, clickable({ textContains: 'browse & explore' }))

  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  await clickTableCell(page, 'dataset list', 2, 2)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Link to a workspace' })) })

  const newWorkspaceName = testWorkspaceName()
  const newWorkspaceBillingAccount = 'general-dev-billing-account'
  await click(page, clickable({ textContains: 'Start with a new workspace' }))
  await fillIn(page, '//*[@placeholder="Enter a name"]', `${newWorkspaceName}`)
  await select(page, 'Billing project', `${newWorkspaceBillingAccount}`)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Create Workspace' })) })
  try {
    // Wait for bucket access to avoid sporadic failures
    await checkBucketAccess(page, newWorkspaceBillingAccount, newWorkspaceName)
    await findText(page, `${newWorkspaceBillingAccount}/${newWorkspaceName}`)
  } finally {
    try {
      await page.evaluate((name, billingProject) => {
        return window.Ajax().Workspaces.workspace(billingProject, name).delete()
      }, `${newWorkspaceName}`, `${newWorkspaceBillingAccount}`)
    } catch (e) {
      console.error(`Error deleting workspace: ${e.message}`)
    }
  }
})

const testLinkToNewWorkspace = {
  name: 'link-to-new-workspace',
  fn: testLinkToNewWorkspaceFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testLinkToNewWorkspace }
