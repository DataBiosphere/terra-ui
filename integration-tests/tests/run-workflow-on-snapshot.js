const _ = require('lodash/fp')
const fetch = require('node-fetch')
const { launchWorkflowAndWaitForSuccess } = require('./run-workflow')
const { withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, delay, dismissNotifications, fillInReplace, findElement, findText, input, select, signIntoTerra, waitForNoSpinners, navChild } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const snapshotName = 'testsnapshot'
const findWorkflowButton = clickable({ textContains: 'Find a Workflow' })

const withDataRepoCheck = test => async options => {
  const { testUrl } = options
  const { dataRepoUrlRoot } = await fetch(`${testUrl}/config.json`).then(res => res.json())
  const res = await fetch(`${dataRepoUrlRoot}/status`)
  if (res.status === 200) {
    return test({ ...options, dataRepoUrlRoot })
  } else {
    console.error('Skipping data repo snapshot test, API appears to be down')
  }
}

const testRunWorkflowOnSnapshotFn = _.flow(
  withWorkspace,
  withUserToken,
  withDataRepoCheck
)(async ({ dataRepoUrlRoot, page, testUrl, snapshotColumnName, snapshotId, snapshotTableName, token, workflowName, workspaceName }) => {
  if (!snapshotId) {
    return
  }
  // IMPORT SNAPSHOT
  await page.goto(`${testUrl}/#import-data?url=${dataRepoUrlRoot}&snapshotId=${snapshotId}&snapshotName=${snapshotName}&format=snapshot`)
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
  await fillInReplace(page, input({ labelContains: 'echo_to_file input1 attribute' }), `this.${snapshotColumnName}`)
  await delay(1000) // Without this delay, the input field sometimes reverts back to its default value
  await click(page, clickable({ text: 'Save' }))

  await click(page, clickable({ textContains: 'Outputs' }))
  // Test again
  await fillInReplace(page, input({ labelContains: 'echo_to_file out attribute' }), 'workspace.result')
  await delay(1000) // Without this delay, the input field sometimes reverts back to its default value
  await click(page, clickable({ text: 'Save' }))

  await delay(1000) // The Run Analysis button (launchWorkflowAndWaitForSuccess) requires time to become enabled after hitting the save button

  await launchWorkflowAndWaitForSuccess(page)

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
