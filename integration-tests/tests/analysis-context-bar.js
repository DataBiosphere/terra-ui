const _ = require('lodash/fp')
const { overrideConfig, withRegisteredUser, withBilling, withWorkspace } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, signIntoTerra, findElement, navChild, noSpinnersAfter, findText, dismissNotifications
} = require('../utils/integration-utils')


const testAnalysisContextBarFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser
)(async ({ workspaceName, page, testUrl, token }) => {
  // Navigate to appropriate part of UI (the analysis tab)
  await page.goto(testUrl)
  await findText(page, 'View Workspaces')
  await overrideConfig(page, { isAnalysisTabVisible: true })
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: workspaceName })) })
  await click(page, navChild('analyses'))

  // Create a runtime
  await click(page, clickable({ textContains: 'Environment Configuration' }))
  await findElement(page, getAnimatedDrawer('Cloud Environment Details'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })) })
  await findElement(page, getAnimatedDrawer('Jupyter Cloud Environment'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })) })

  // Ensure UI displays the runtime is creating and the terminal icon is present + disabled
  await findElement(page, clickable({ textContains: 'Terminal', isEnabled: false }))
  await click(page, clickable({ textContains: 'Jupyter Environment ( Creating )' }), { timeout: 10000 })

  // Updating/modifying the environment should be disabled when the env is creating
  await findElement(page, getAnimatedDrawer('Jupyter Environment Details'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })) })
  await findElement(page, clickable({ text: 'Update', isEnabled: false }))
  await click(page, clickable({ textContains: 'Close' }))

  // Environment should eventually be running and the terminal icon should be enabled once the environment is running
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Running )' }), { timeout: 10 * 60000 })
  await findElement(page, clickable({ textContains: 'Terminal' }))

  // The environment should now be pausable, and the UI should display its pausing
  await click(page, clickable({ textContains: 'Jupyter Environment ( Running )' }))
  await findElement(page, getAnimatedDrawer('Jupyter Environment Details'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Pause' })) })
  await findElement(page, clickable({ textContains: 'Pausing', isEnabled: false }))
  await click(page, clickable({ textContains: 'Close' }))
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Pausing )' }), { timeout: 10000 })

  // We don't wait for the env to pause for the sake of time, since its redundant and more-so tests the backend
})

const testAnalysisContextBar = {
  name: 'analysis-context-bar',
  fn: testAnalysisContextBarFn
}

module.exports = { testAnalysisContextBar }
