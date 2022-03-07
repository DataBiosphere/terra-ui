const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace } = require('../utils/integration-helpers')
const {
  click, clickable, delay, getAnimatedDrawer, signIntoTerra, findElement, navChild, noSpinnersAfter, select, fillIn, input, findAltText, findText,
  dismissNotifications
} = require('../utils/integration-utils')


const notebookName = 'analysis-test-notebook'

const testRunInteractiveAnalysisFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser
)(async ({ workspaceName, page, testUrl, token }) => {
  await page.goto(testUrl)
  await findText(page, 'View Workspaces')
  // Enable Analyses tab
  // TODO: Consider factoring out this part from enableDataCatalog()
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
  await delay(2000)
  await click(page, clickable({ textContains: 'Create new notebook' }))
  await delay(3000)
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName)
  await delay(3000)
  await select(page, 'Language', 'Python 3')
  await delay(3000)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Analysis' })) })
  await delay(3000)
})
const testRunInteractiveAnalysis = {
  name: 'run-interactive-analysis',
  fn: testRunInteractiveAnalysisFn,
  timeout: 20 * 60 * 1000
}

module.exports = { testRunInteractiveAnalysis }
