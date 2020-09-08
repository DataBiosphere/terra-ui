const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, delay, signIntoTerra, findElement, waitForNoSpinners, select, fillIn, input, findIframe, findText, dismissNotifications } = require('../utils/integration-utils')


const notebookName = 'TestNotebook'

const testRunNotebookFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser
)(async ({ workspaceName, page, testUrl, token }) => {
  await page.goto(testUrl)
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await findElement(page, clickable({ textContains: workspaceName }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: workspaceName }))
  await click(page, clickable({ text: 'notebooks' }))
  await click(page, clickable({ textContains: 'Create a' }))
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName)
  await select(page, 'Language', 'Python 2')
  await click(page, clickable({ text: 'Create Notebook' }))
  await click(page, clickable({ textContains: notebookName }))
  await click(page, clickable({ text: 'Edit' }))
  // wait for drawer to slide in before clicking, otherwise we'll miss the button
  await delay(1000)
  await click(page, clickable({ text: 'Customize' }))
  await select(page, 'Application', 'Hail')
  await click(page, clickable({ text: 'Create' }))
  await findElement(page, clickable({ textContains: 'Creating' }))
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: 10 * 60 * 1000 })

  const frame = await findIframe(page)
  await fillIn(frame, '//textarea', 'print(123456789099876543210990+9876543219)')
  await click(frame, clickable({ text: 'Run' }))
  await findText(frame, '123456789099886419754209')
})
const testRunNotebook = {
  name: 'run-notebook',
  fn: testRunNotebookFn,
  timeout: 15 * 60 * 1000

}

module.exports = { testRunNotebook }
