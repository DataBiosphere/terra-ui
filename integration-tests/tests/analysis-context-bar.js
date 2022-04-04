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
  await page.goto(testUrl)
  await findText(page, 'View Workspaces')
  await overrideConfig(page, { isAnalysisTabVisible: true })

  await click(page, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: workspaceName })) })
  await click(page, navChild('analyses'))

  await click(page, clickable({ textContains: 'Environment Configuration' }))
  await findElement(page, getAnimatedDrawer('Cloud Environment Details'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })) })
  await findElement(page, getAnimatedDrawer('Jupyter Cloud Environment'))

  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })) })
  await findElement(page, clickable({ textContains: 'Terminal', isEnabled: false }))
  await click(page, clickable({ textContains: 'Jupyter Environment ( Creating )' }), { timeout: 10000 })

  //Update should be disabled when env is creating
  await findElement(page, getAnimatedDrawer('Jupyter Environment Details'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })) })
  await findElement(page, clickable({ text: 'Update', isEnabled: false }))
  await click(page, clickable({ textContains: 'Close' }))

  //Environment should eventually be running and pausable
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Running )' }), { timeout: 10 * 60000 })
  await findElement(page, clickable({ textContains: 'Terminal' }))

  await click(page, clickable({ textContains: 'Jupyter Environment ( Running )' }))
  await findElement(page, getAnimatedDrawer('Jupyter Environment Details'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Pause' })) })
  await findElement(page, clickable({ textContains: 'Pausing', isEnabled: false }))
  await click(page, clickable({ textContains: 'Close' }))
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Pausing )' }), { timeout: 10000 })
})

const testAnalysisContextBar = {
  name: 'analysis-context-bar',
  fn: testAnalysisContextBarFn
}

module.exports = { testAnalysisContextBar }
