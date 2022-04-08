const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace, performAnalysisTabSetup } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, findElement, noSpinnersAfter, delay
} = require('../utils/integration-utils')


const testAnalysisContextBarFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser
)(async ({ page, token, testUrl, workspaceName }) => {
  // Navigate to appropriate part of UI (the analysis tab)
  await performAnalysisTabSetup(page, token, testUrl, workspaceName)

  // Create a runtime
  await click(page, clickable({ textContains: 'Environment Configuration' }), { timeout: 60000 } )
  await findElement(page, getAnimatedDrawer('Cloud Environment Details'), { timeout: 60000 })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })), debugMessage: '1'})
  await findElement(page, getAnimatedDrawer('Jupyter Cloud Environment'), { timeout: 40000 })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })), debugMessage: '2'})

  // Ensure UI displays the runtime is creating and the terminal icon is present + disabled
  await findElement(page, clickable({ textContains: 'Terminal', isEnabled: false }))
  await click(page, clickable({ textContains: 'Jupyter Environment ( Creating )' }), { timeout: 40000 })

  // Updating/modifying the environment should be disabled when the env is creating
  await findElement(page, getAnimatedDrawer('Jupyter Environment Details'), { timeout: 40000 })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })), debugMessage: '3'})
  await findElement(page, clickable({ text: 'Update', isEnabled: false }), { timeout: 10000 })
  await click(page, clickable({ textContains: 'Close' }))

  // Environment should eventually be running and the terminal icon should be enabled once the environment is running
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Running )' }), { timeout: 10 * 60000 })
  await findElement(page, clickable({ textContains: 'Terminal' }))

  // The environment should now be pausable, and the UI should display its pausing
  await click(page, clickable({ textContains: 'Jupyter Environment ( Running )' }))
  await findElement(page, getAnimatedDrawer('Jupyter Environment Details'), { timeout: 40000 })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Pause' })), debugMessage: '4'})
  await findElement(page, clickable({ textContains: 'Pausing', isEnabled: false }))
  await click(page, clickable({ textContains: 'Close' }))
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Pausing )' }), { timeout: 40000 })

  // We don't wait for the env to pause for the sake of time, since its redundant and more-so tests the backend
})

const testAnalysisContextBar = {
  name: 'analysis-context-bar',
  fn: testAnalysisContextBarFn
}

module.exports = { testAnalysisContextBar }
