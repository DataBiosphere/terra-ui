const _ = require('lodash/fp')
const fetch = require('node-fetch')
const pRetry = require('p-retry')
const { withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, delay, dismissNotifications, findElement, findText, fillIn, input, select, signIntoTerra, waitForNoSpinners, findInGrid, navChild } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const snapshotName = 'testsnapshot'
const findWorkflowButton = clickable({ textContains: 'Find a Workflow' })

const withDataRepoCheck = test => async options => {
  const { dataRepoUrl } = options
  const res = await fetch(`${dataRepoUrl}/status`)
  if (res.status === 200) {
    return test({ ...options, dataRepoUrl })
  } else {
    console.error('Skipping data repo snapshot test, API appears to be down')
  }
}

const testRunWorkflowOnSnapshotFn = _.flow(
  withWorkspace,
  withUserToken,
  withDataRepoCheck
)(async ({ dataRepoUrl, page, testUrl, snapshotColumnName, snapshotId, snapshotTableName, token, workflowName, workspaceName }) => {
  if (!snapshotId) {
    return
  }
  // IMPORT SNAPSHOT
  await page.goto(`${testUrl}/#import-data?url=${dataRepoUrl}&snapshotId=${snapshotId}&snapshotName=${snapshotName}&format=snapshot`)
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await click(page, clickable({ textContains: 'Start with an existing workspace' }))
  await select(page, 'Select a workspace', workspaceName)
  await click(page, clickable({ text: 'Import' }))

  // ADD WORKFLOW
  await click(page, navChild('workflows'))
  await findElement(page, findWorkflowButton)
  await waitForNoSpinners(page)
  await click(page, findWorkflowButton)
  await click(page, clickable({ textContains: workflowName }))
  await waitForNoSpinners(page)
  await click(page, clickable({ text: 'Add to Workspace' }))

  // START WORKFLOW ON SNAPSHOT
  // note that this automatically brings in the highest numbered config, which isn't what happens when going through the method repo in FC
  await waitForNoSpinners(page)
  await select(page, 'Entity type selector', snapshotName)
  await select(page, 'Snapshot table selector', snapshotTableName)

  await click(page, clickable({ textContains: 'Inputs' }))
  await (await findElement(page, input({ labelContains: 'echo_strings.echo_to_file.input1' }))).click({ clickCount: 3 })
  await fillIn(page, input({ labelContains: 'echo_strings.echo_to_file.input1' }), `this.${snapshotColumnName}`)
  await delay(100) // Without this delay, the input field sometimes reverts back to its default value
  await click(page, clickable({ text: 'Save' }))

  await click(page, clickable({ textContains: 'Outputs' }))
  await (await findElement(page, input({ labelContains: 'echo_strings.echo_to_file.out' }))).click({ clickCount: 3 })
  await fillIn(page, input({ labelContains: 'echo_strings.echo_to_file.out' }), 'workspace.result')
  await delay(1000) // Without this delay, the input field sometimes reverts back to its default value
  await click(page, clickable({ text: 'Save' }))

  await delay(1000) // The Run Analysis button requires time to become enabled after hitting the save button
  await click(page, clickable({ textContains: 'Run analysis' }))

  await Promise.all([
    page.waitForNavigation(),
    click(page, clickable({ text: 'Launch' }))
  ])

  // CHECK WORKFLOW SUCCEEDED AND RESULT IS WRITTEN
  await pRetry(async () => {
    try {
      await findInGrid(page, 'Succeeded', { timeout: 65 * 1000 }) // long enough for the submission details to refresh
    } catch (e) {
      throw new Error(e)
    }
  }, { retries: 10, factor: 1 })

  await click(page, navChild('data'))
  await click(page, clickable({ textContains: 'Workspace Data' }))
  await findText(page, 'result: ')
})

const testRunWorkflowOnSnapshot = {
  name: 'run-workflow-on-snapshot',
  fn: testRunWorkflowOnSnapshotFn,
  timeout: 15 * 60 * 1000
}

module.exports = { testRunWorkflowOnSnapshot }
