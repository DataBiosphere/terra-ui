const { linkDataToWorkspace, eitherThrow } = require('../utils/catalog-utils')
const { click, clickable, fillIn, findText, noSpinnersAfter, select } = require('../utils/integration-utils')
const { checkBucketAccess, testWorkspaceName } = require('../utils/integration-helpers')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const testLinkToNewWorkspaceFn = withUserToken(async ({ billingProject, page, testUrl, token }) => {
  await linkDataToWorkspace(page, testUrl, token)
  const newWorkspaceName = testWorkspaceName()
  await click(page, clickable({ textContains: 'Start with a new workspace' }))
  await fillIn(page, '//*[@placeholder="Enter a name"]', `${newWorkspaceName}`)
  await select(page, 'Billing project', `${billingProject}`)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Create Workspace' })) })

  const waitForWorkspacePage = async () => {
    try {
      await checkBucketAccess(page, billingProject, newWorkspaceName)
      await findText(page, `${billingProject}/${newWorkspaceName}`)
      await findText(page, 'Select a data type')
    } catch (error) {
      return error
    }
  }

  const cleanupFn = async () => {
    try {
      await page.evaluate(async (name, billingProject) => {
        return await window.Ajax().Workspaces.workspace(billingProject, name).delete()
      }, newWorkspaceName, billingProject)
    } catch (error) {
      return error
    }
  }

  const workspaceFailure = await waitForWorkspacePage()
  const cleanupFailure = await cleanupFn()

  if (workspaceFailure || cleanupFailure) {
    eitherThrow(workspaceFailure, {
      cleanupFailure,
      cleanupMessage: `Failed to delete workspace: ${newWorkspaceName} with billing project ${billingProject}`
    })
  }
})

registerTest({
  name: 'link-to-new-workspace',
  fn: testLinkToNewWorkspaceFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['dev', 'local']
})
