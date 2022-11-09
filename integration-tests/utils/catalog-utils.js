const { navigateToDataCatalog, testWorkspaceName } = require('../utils/integration-helpers')
const { click, clickable, checkbox, clickTableCell, noSpinnersAfter, waitForNoSpinners, fillIn, select, findText } = require('../utils/integration-utils')


const eitherThrow = (testFailure, { cleanupFailure, cleanupMessage }) => {
  if (testFailure) {
    cleanupFailure && console.error(`${cleanupMessage}: ${cleanupFailure.message}`)
    throw testFailure
  } else if (cleanupFailure) {
    throw new Error(`${cleanupMessage}: ${cleanupFailure.message}`)
  }
}

const linkDataToWorkspace = async (page, testUrl, token, datasetName) => {
  await navigateToDataCatalog(page, testUrl, token)
  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  // TODO: add test data with granted access DC-321
  await clickTableCell(page, { tableName: 'dataset list', columnHeader: 'Dataset Name', text: datasetName, isDescendant: true })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Prepare for analysis' })) })
}

const testExportToNewWorkspace = async (billingProject, page, testUrl, token, datasetName) => {
  await linkDataToWorkspace(page, testUrl, token, datasetName)
  const newWorkspaceName = testWorkspaceName()
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Start with a new workspace' }))
  await fillIn(page, '//*[@placeholder="Enter a name"]', `${newWorkspaceName}`)
  await select(page, 'Billing project', `${billingProject}`)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Create Workspace' })) })

  const waitForWorkspacePage = async () => {
    try {
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
}

module.exports = { eitherThrow, linkDataToWorkspace, testExportToNewWorkspace }
