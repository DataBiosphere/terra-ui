const { testUrl } = require('../utils/integration-config')
const { withUser } = require('../utils/integration-helpers')
const { findText, click, clickable, fillIn, input, signIntoTerra, waitForNoSpinners } = require('../utils/integration-utils')


test('register user', withUser(async ({ token }) => {
  await page.goto(testUrl)
  await signIntoTerra(page, token)
  await fillIn(page, input({labelContains: 'First Name'}), 'Integration')
  await fillIn(page, input({labelContains: 'Last Name'}), 'Test')
  await click(page, clickable({textContains: 'Register'}))
  await waitForNoSpinners(page)
  await click(page, clickable({textContains: 'Accept'}))
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await findText(page, 'To get started, click Create a New Workspace')
}), 5 * 60 * 1000)
