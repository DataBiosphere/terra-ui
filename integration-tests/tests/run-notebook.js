const { testUrl } = require('../utils/integration-config')
const { withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, signIntoTerra, findElement, waitForNoSpinners, select, delay, fillIn, input, findIframe, findText, dismissNotifications } = require(
  '../utils/integration-utils')


const testRunNotebookFn = withWorkspace(async ({ page, workspaceName }) => {
  await page.goto(testUrl)
  await signIntoTerra(page)
  await dismissNotifications(page)
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await findElement(page, clickable({ textContains: workspaceName }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: workspaceName }))
  await click(page, clickable({ text: 'notebooks' }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Create a' }))
  await fillIn(page, input({ placeholder: 'Enter a name' }), 'Test')// need to have a notebook name saved like workspacename
  await select(page, 'Select a language', 'Python 2')
  await click(page, clickable({ text: 'Create Notebook' }))
  await waitForNoSpinners(page)
  await click(page, clickable({ text: 'Card view' }))
  await click(page, clickable({ textContains: 'Last edited:' }))
  await click(page, clickable({ text: 'Edit' }))
  await select(page, 'Select Environment', 'Hail')
  await click(page, clickable({ text: 'Create' }))
  await delay(5000)
  await findElement(page, clickable({ textContains: 'Creating' }))
  await delay(300000)
  await findElement(page, clickable({ textContains: 'Running' }))
  const frame = await findIframe(page)
  await fillIn(frame, '//textarea', 'print(23+4)')
  await click(frame, clickable({ text: 'Run' }))
  await findText(frame, '27')
})

const testRunNotebook = {
  name: 'run notebook',
  fn: testRunNotebookFn,
  timeout: 15 * 60 * 1000

}

module.exports = { testRunNotebook }
