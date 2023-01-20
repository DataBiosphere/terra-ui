// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp')
const { deleteRuntimes, withWorkspace, performAnalysisTabSetup } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, findElement, noSpinnersAfter, findButtonInDialogByAriaLabel
} = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const testAnalysisContextBarFn = _.flowRight(
  withUserToken,
  withWorkspace,
)(async ({ billingProject, page, token, testUrl, workspaceName }) => {
  // Navigate to appropriate part of UI (the analysis tab)
  await performAnalysisTabSetup(page, token, testUrl, workspaceName)

  // Ensure UI displays the runtime Terminal icon is present + disabled
  const tooltipTextTerminal = 'Terminal'
  await findElement(page, clickable({ textContains: tooltipTextTerminal, isEnabled: false }))

  // Create a runtime
  await click(page, clickable({ textContains: 'Environment Configuration' }))
  await findElement(page, getAnimatedDrawer('Cloud Environment Details'))
  await noSpinnersAfter(page, { action: () => findButtonInDialogByAriaLabel(page, 'Jupyter Environment').then(element => element.click()) })
  await findElement(page, getAnimatedDrawer('Jupyter Cloud Environment'), { timeout: 40000 })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })) })

  // We need a way to determine UI has finished loading after click Create. The START button is located in the main page.
  // Loading of page could take few seconds or less so we find the START button and wait for visible.
  // Click 'Jupyter Environment ( Creating )' icon could fail if page has not finished loading.
  await findElement(page, clickable({ textContains: 'Start' }), { visible: true })

  // Ensure UI displays the runtime is creating and the Terminal icon is present + enabled
  await findElement(page, clickable({ textContains: tooltipTextTerminal, isEnabled: true }), { visible: true })

  const tooltipTextEnvCreating = 'Creating'
  const jupyterEnvIcon = await findElement(page, clickable({ textContains: tooltipTextEnvCreating, isEnabled: true }), { visible: true })
  await jupyterEnvIcon.click()

  // Updating/modifying the environment should be disabled when the env is creating
  await findElement(page, getAnimatedDrawer('Jupyter Environment Details'), { timeout: 40000 })
  await noSpinnersAfter(page, { action: () => findButtonInDialogByAriaLabel(page, 'Jupyter Environment').then(element => element.click()) })
  await findElement(page, clickable({ text: 'Update', isEnabled: false }), { timeout: 40000 })
  await click(page, clickable({ textContains: 'Close' }))

  // Environment should eventually be running and the terminal icon should be enabled once the environment is running
  await findElement(page, clickable({ textContains: 'Jupyter Environment' }), { timeout: 10 * 60000 })
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: 10 * 60 * 1000 })
  await findElement(page, clickable({ textContains: 'Terminal' }))

  // The environment should now be pausable, and the UI should display its pausing
  await click(page, clickable({ textContains: 'Running' }))
  await findElement(page, getAnimatedDrawer('Jupyter Environment Details'), { timeout: 40000 })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Pause' })) })
  await findElement(page, clickable({ textContains: 'Pausing', isEnabled: false }))
  await click(page, clickable({ textContains: 'Close' }))
  await findElement(page, clickable({ textContains: 'Pausing' }), { timeout: 40000 })

  // We don't wait for the env to pause for the sake of time, since its redundant and more-so tests the backend

  await deleteRuntimes({ page, billingProject, workspaceName })
})

registerTest({
  name: 'analysis-context-bar',
  fn: testAnalysisContextBarFn,
  timeout: 15 * 60 * 1000,
  targetEnvironments: [] // Disabled test. Previous environments: ['dev', 'staging']
})
