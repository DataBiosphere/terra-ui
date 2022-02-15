const { linkDataToWorkspace, eitherThrow } = require('../utils/catalog-utils')
const { click, clickable, fillIn, findText, noSpinnersAfter, select } = require('../utils/integration-utils')
const { checkBucketAccess, testWorkspaceName } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const testLinkToNewWorkspaceFn = withUserToken(async ({ page, testUrl, token }) => {
  await linkDataToWorkspace(page, testUrl, token)
  const newWorkspaceName = testWorkspaceName()
  const newWorkspaceBillingAccount = 'general-dev-billing-account'
  await click(page, clickable({ textContains: 'Start with a new workspace' }))
  await fillIn(page, '//*[@placeholder="Enter a name"]', `${newWorkspaceName}`)
  await select(page, 'Billing project', `${newWorkspaceBillingAccount}`)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Create Workspace' })) })

  const waitForWorkspacePage = async () => {
    try {
      await checkBucketAccess(page, newWorkspaceBillingAccount, newWorkspaceName)
      await findText(page, `${newWorkspaceBillingAccount}/${newWorkspaceName}`)
      await findText(page, 'Select a data type')
    } catch (error) {
      return error
    }
  }

  const cleanupFn = async () => {
    try {
      await page.evaluate((name, billingProject) => {
        return window.Ajax().Workspaces.workspace(billingProject, name).delete()
      }, `${newWorkspaceName}`, `${newWorkspaceBillingAccount}`)
    } catch (error) {
      return error
    }
  }

  const workspaceFailure = await waitForWorkspacePage()
  const cleanupFailure = await cleanupFn()

  if (workspaceFailure || cleanupFailure) {
    eitherThrow(workspaceFailure, {
      cleanupFailure,
      cleanupMessage: `Failed to delete workspace: ${newWorkspaceName} with billing project ${newWorkspaceBillingAccount}`
    })
  }
})

const testLinkToNewWorkspace = {
  name: 'link-to-new-workspace',
  fn: testLinkToNewWorkspaceFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testLinkToNewWorkspace }
