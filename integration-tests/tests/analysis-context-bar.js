const _ = require('lodash/fp')
const { overrideConfig, withRegisteredUser, withBilling, withWorkspace, withRuntime } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, image, signIntoTerra, findElement, navChild, noSpinnersAfter, select, fillIn, input, findText,
  dismissNotifications
} = require('../utils/integration-utils')

const testAnalysisContextBarFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser,
  withRuntime
)(async ({ workspaceName, page, testUrl, token, runtimeName }) => {
  await page.goto(testUrl)
  await findText(page, 'View Workspaces')
  await overrideConfig(page, { isAnalysisTabVisible: true })

  await click(page, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: workspaceName })) })
  await click(page, navChild('analyses'))


})

const testAnalysisContextBar = {
  name: 'create-interactive-analysis',
  fn: testAnalysisContextBarFn
}

module.exports = { testAnalysisContextBar }
