// This test is owned by the Workspaces Team.
const { withUser } = require('../utils/integration-helpers')
const { fillIn, findText, click, clickable, input, signIntoTerra, dismissNotifications } = require('../utils/integration-utils')


const testRegisterUserFn = withUser(async ({ page, testUrl, token }) => {
  await page.goto(testUrl)
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await fillIn(page, input({ labelContains: 'First Name' }), 'Integration')
  await fillIn(page, input({ labelContains: 'Last Name' }), 'Test')
  await click(page, clickable({ textContains: 'Register' }))
  await click(page, clickable({ textContains: 'Accept' }))
  await findText(page, 'To get started, Create a New Workspace')
})

const testRegisterUser = {
  name: 'register-user',
  fn: testRegisterUserFn
}

module.exports = { testRegisterUser }
