const _ = require('lodash/fp')
const fetch = require('node-fetch')
const { click, clickable, fillInReplace, findElement, findText, input, select, signIntoTerra, waitForNoSpinners, navChild } = require(
  '../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { launchWorkflowAndWaitForSuccess } = require('../utils/workflow-utils')
const { clickNavChildAndLoad, withWorkspace } = require('../utils/integration-helpers')


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
)(async ({
  dataRepoUrlRoot, page, testUrl: testUrlRoot, snapshotColumnName, snapshotId, snapshotTableName, token, workflowName, workspaceName
}) => {
  if (!snapshotId) {
    return
  }
  // IMPORT SNAPSHOT
  const testUrl = `${testUrlRoot}/#import-data?url=${dataRepoUrlRoot}&snapshotId=${snapshotId}&snapshotName=${snapshotName}&format=snapshot`
  await signIntoTerra(page, { token, testUrl })

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

  await click(page, clickable({ textContains: 'Outputs' }))
  await fillInReplace(page, input({ labelContains: 'echo_to_file out attribute' }), 'workspace.result')

  await click(page, clickable({ text: 'Save' }))

  await launchWorkflowAndWaitForSuccess(page)

  await clickNavChildAndLoad(page, 'data')
  // Before click "Workspace Data" link, we need to make sure page has rendered all UI elements.
  // "testsnapshot" link can take few seconds more to render on page. When `testsnapshot" link is finally visible on page,
  // all links which are below it will shift (move) downward.
  // If we don't wait for the "testsnapshot" link to be visible in UI, the "Workspace Data" link could move when trying to click on it.
  await findElement(page, clickable({ textContains: 'testsnapshot' }))
  await click(page, clickable({ textContains: 'Workspace Data' }))
  await findText(page, 'result: ')
})

registerTest({
  name: 'run-workflow-on-snapshot',
  fn: testRunWorkflowOnSnapshotFn,
  timeout: 20 * 60 * 1000,
  targetEnvironments: [],
})
