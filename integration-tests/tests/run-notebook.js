const { withRegisteredUser, withBilling, withWorkspace } = require('../utils/integration-helpers')
const { testUrl } = require('../utils/integration-config')

const { click, clickable, signIntoTerra, findElement, waitForNoSpinners, select, delay, fillIn, input, findIframe, findText, dismissNotifications } = require(
  '../utils/integration-utils')


const notebookName = 'TestNotebook'

const testRunNotebookFn = withRegisteredUser(async ({ page, context, email, token }) => {
  await withBilling(withWorkspace(async ({ workspaceName }) => {
    await page.goto(testUrl)
    await click(page, clickable({ textContains: 'View Workspaces' }))
    await signIntoTerra(page, token)
    await dismissNotifications(page)
    await click(page, clickable({ textContains: 'Accept' }))
    await findElement(page, clickable({ textContains: workspaceName }))
    await waitForNoSpinners(page)
    await click(page, clickable({ textContains: workspaceName }))
    await click(page, clickable({ text: 'notebooks' }))
    await click(page, clickable({ textContains: 'Create a' }))
    await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName)
    await select(page, 'Select a language', 'Python 2')
    await click(page, clickable({ text: 'Create Notebook' }))
    await click(page, clickable({ textContains: notebookName }))
    await click(page, clickable({ text: 'Edit' }))
    await select(page, 'Select Environment', 'Hail')
    await click(page, clickable({ text: 'Create' }))
    await findElement(page, clickable({ textContains: 'Creating' }))
    await findElement(page, clickable({ textContains: 'Running' }), { timeout: 3000000 })
    await delay(5000) //wait for copy over or change of status

    const frame = await findIframe(page)
    await fillIn(frame, '//textarea', 'print(23+4)')
    await click(frame, clickable({ text: 'Run' }))
    await findText(frame, '27')
    await click(page, clickable({ textContains: 'Notebook Runtime' }))

    //Clean up TODO: Add failsafe sweep up script
    await click(page, clickable({ textContains: 'Delete Runtime' }))
    await click(page, clickable({ textContains: 'DELETE' }))
    await findElement(page, clickable({ textContains: 'None' }))
    await findText(page, 'PREVIEW (READ-ONLY)')
  }))({ context, email, token })
})
const testRunNotebook = {
  name: 'run notebook',
  fn: testRunNotebookFn,
  timeout: 15 * 60 * 1000

}

module.exports = { testRunNotebook }
