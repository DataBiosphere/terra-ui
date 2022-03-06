const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, signIntoTerra, findElement, navChild, waitForNoSpinners, noSpinnersAfter, select, fillIn, input, findIframe,
  findAltText, findText, dismissNotifications
} = require('../utils/integration-utils')


const notebookName = 'TestAnalysis'

const testRunInteractiveAnalysisFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser
)(async ({ workspaceName, page, testUrl, token }) => {
  await page.goto(testUrl)
  await findText(page, 'View Workspaces')
  // Enable Analyses tab
  await page.evaluate(() => window.configOverridesStore.set({ isAnalysisTabVisible: true }))
  await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: workspaceName })) })
  await click(page, navChild('analyses')) // TODO Consider clicking on tab instead
  await click(page, clickable({ textContains: 'Create' }))
  await findElement(page, getAnimatedDrawer('Select an application'))
  await findAltText(page, 'Create new notebook')
})
const testRunInteractiveAnalysis = {
  name: 'run-interactive-analysis',
  fn: testRunInteractiveAnalysisFn,
  timeout: 20 * 60 * 1000
}

module.exports = { testRunInteractiveAnalysis }
