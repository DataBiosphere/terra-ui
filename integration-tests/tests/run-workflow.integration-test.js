const pRetry = require('p-retry')
const { testUrl, workflowName, billingProject } = require('../utils/integration-config')
const { withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, findElement, input, signIntoTerra, waitForNoSpinners, findInGrid, workspaceTab } = require('../utils/integration-utils')


const testEntity = { name: 'test_entity_1', entityType: 'test_entity', attributes: { input: 'foo' } }

test('run workflow', withWorkspace(async ({ workspaceName }) => {
  await page.goto(testUrl)
  await signIntoTerra(page)

  await page.evaluate((name, billingProject, testEntity) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).createEntity(testEntity)
  }, workspaceName, billingProject, testEntity)

  await click(page, clickable({ textContains: 'View Workspaces' }))
  await click(page, clickable({ textContains: workspaceName }))

  await click(page, workspaceTab('workflows'))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Find a Workflow' }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: workflowName }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Add to Workspace' }))

  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Select Data' }))
  await click(page, input({ labelContains: 'Choose specific rows to process' }))
  await click(page, `//*[@role="checkbox" and contains(@aria-label, "${testEntity.name}")]`)
  await click(page, clickable({ textContains: 'OK' }))
  await click(page, clickable({ textContains: 'Run analysis' }))

  await Promise.all([
    page.waitForNavigation(),
    click(page, clickable({ textContains: 'Launch' }))
  ])

  await pRetry(async () => {
    try {
      await waitForNoSpinners(page)
      await findInGrid(page, 'Succeeded')
    } catch (e) {
      throw new Error(e)
    }
  }, {
    onFailedAttempt: async () => {
      await page.reload()
      await signIntoTerra(page)
    }
  })

  await click(page, workspaceTab('data'))
  await click(page, clickable({ textContains: 'test_entity' }))
  await waitForNoSpinners(page)
  await findElement(page, `//*[@role="grid"]//*[contains(.,"${testEntity.name}")]/following-sibling::*[contains(.,"result: ${testEntity.attributes.input}")]`)
}), 10 * 60 * 1000)
