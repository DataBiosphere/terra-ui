const _ = require('lodash/fp')
const { overrideConfig, withRegisteredUser, withBilling, withWorkspace, withRuntime } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, image, signIntoTerra, findElement, navChild, noSpinnersAfter, select, fillIn, input, findText,
  dismissNotifications
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
  // await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Confirm' })) })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })) })
  await click(page, clickable({ textContains: 'Jupyter Environment ( Creating )'}), { timeout: 60000 })

})

const testAnalysisContextBar = {
  name: 'analysis-context-bar',
  fn: testAnalysisContextBarFn
}

module.exports = { testAnalysisContextBar }
