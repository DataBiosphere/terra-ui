const _ = require('lodash/fp')
const { checkBucketAccess, withWorkspace, createEntityInWorkspace } = require('../utils/integration-helpers')
const { click, clickable, findElement, fillIn, input, signIntoTerra, waitForNoSpinners, navChild, findInDataTableRow } = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { launchWorkflowAndWaitForSuccess } = require('../utils/workflow-utils')


const testEntity = { name: 'test_entity_1', entityType: 'test_entity', attributes: { input: 'foo' } }
const findWorkflowButton = clickable({ textContains: 'Find a Workflow' })

const testRunWorkflowFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ billingProject, page, testUrl, token, workflowName, workspaceName }) => {
  await signIntoTerra(page, { token, testUrl })

  await createEntityInWorkspace(page, billingProject, workspaceName, testEntity)
  // Wait for bucket access to avoid sporadic failure when launching workflow.
  await checkBucketAccess(page, billingProject, workspaceName)

  await click(page, clickable({ textContains: 'View Workspaces' }))
  await waitForNoSpinners(page)
  await fillIn(page, input({ placeholder: 'SEARCH WORKSPACES' }), workspaceName)
  await click(page, clickable({ textContains: workspaceName }))

  await click(page, navChild('workflows'))
  await findElement(page, findWorkflowButton)
  await waitForNoSpinners(page)
  await click(page, findWorkflowButton)
  await click(page, clickable({ textContains: workflowName }))
  await waitForNoSpinners(page)
  await click(page, clickable({ text: 'Add to Workspace' }))
  // note that this automatically brings in the highest numbered config, which isn't what happens when going through the method repo in FC

  await waitForNoSpinners(page)
  await click(page, clickable({ text: 'Select Data' }))
  await click(page, input({ labelContains: 'Choose specific test_entitys to process' }))
  await click(page, `//*[@role="checkbox" and contains(@aria-label, "${testEntity.name}")]`)
  await click(page, clickable({ text: 'OK' }))

  await launchWorkflowAndWaitForSuccess(page)

  await click(page, navChild('data'))
  await click(page, clickable({ textContains: 'test_entity' }))
  await findInDataTableRow(page, testEntity.name, testEntity.attributes.input)
})

registerTest({
  name: 'run-workflow',
  fn: testRunWorkflowFn,
  timeout: 15 * 60 * 1000
})
