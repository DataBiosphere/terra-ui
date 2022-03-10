const _ = require('lodash/fp')
const { overrideConfig, withRegisteredUser, withBilling, withWorkspace } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, image, signIntoTerra, findElement, navChild, noSpinnersAfter, select, fillIn, input, findText,
  dismissNotifications
} = require('../utils/integration-utils')


const notebookName = 'analysis-test-notebook'

const testCreateInteractiveAnalysisFn = _.flow(
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
  await click(page, clickable({ textContains: 'Create' }))
  await findElement(page, getAnimatedDrawer('Select an application'))
  await click(page, image({ text: 'Create new notebook' }))
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName)
  await select(page, 'Language', 'Python 3')
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Analysis' })) })
  await findText(page, 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).')
})
const testCreateInteractiveAnalysis = {
  name: 'create-interactive-analysis',
  fn: testCreateInteractiveAnalysisFn
}

module.exports = { testCreateInteractiveAnalysis }
