const { testUrl } = require('../utils/integration-config')
const { withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, signIntoTerra, findElement, waitForNoSpinners } = require('../utils/integration-utils')


const testRunNotebookFn = withWorkspace(async ({ page, workspaceName }) => {
  await page.goto(testUrl)
  await signIntoTerra(page)
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await findElement(page, clickable({ textContains: workspaceName }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: workspaceName }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Notebook Runtime' }))


})

const testRunNotebook = {
  name: 'run notebook',
  fn: testRunNotebookFn
}

module.exports = { testRunNotebook }
