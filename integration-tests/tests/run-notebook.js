const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, delay, signIntoTerra, findElement, navChild, waitForNoSpinners, select, fillIn, input, findIframe, findText, dismissNotifications } = require('../utils/integration-utils')


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
  await delay(5000)
  await click(page, navChild('notebooks'))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Create a' }))
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName)
  await select(page, 'Language', 'Python 3')
  await click(page, clickable({ text: 'Create Notebook' }))
  await click(page, clickable({ textContains: notebookName }))
  await waitForNoSpinners(page)
  await click(page, clickable({ text: 'Edit' }))
  // There are two separate activities in the UI that could interfere with beginning to interact
  // with the modal for creating a cloud environment:
  //   1. AJAX calls to load cloud environment details and available docker images
  //      - renders a spinner overlay on top of UI elements
  //   2. The drawer slide-in animation
  //      - causes UI elements to move before puppeteer clicks on them
  // Experimentation has shown that there's enough of a gap between clicking 'Edit' and the AJAX
  // spinner being rendered that simply waiting for no spinners does not work; the test recognizes
  // that there aren't any spinners before the spinner has a chance to render. Additionally, even
  // though the slide-in animation is supposedly only 200ms, experimentation has shown that even a
  // 500ms delay in the test is not enough to guarantee that the UI elements have finished moving.
  // Therefore, we start with a 2000ms delay, then make sure there are no spinners just in case the
  // AJAX calls are unexpectedly slow.
  await delay(2000)
  waitForNoSpinners(page)
  await click(page, clickable({ text: 'Create' }))
  await findElement(page, clickable({ textContains: 'Creating' }))
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: 10 * 60 * 1000 })

  const frame = await findIframe(page)
  await findElement(frame, '//*[@title="Kernel Idle"]')
  await fillIn(frame, '//textarea', 'print(123456789099876543210990+9876543219)')
  await click(frame, clickable({ text: 'Run' }))
  await findText(frame, '123456789099886419754209')
  // Save notebook to avoid "unsaved changes" modal when test tear-down tries to close the window
  await click(frame, clickable({ text: 'Save and Checkpoint' }))
})
const testRunNotebook = {
  name: 'run-notebook',
  fn: testRunNotebookFn,
  timeout: 20 * 60 * 1000
}

module.exports = { testRunNotebook }
