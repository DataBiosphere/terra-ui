const { withRegisteredUser } = require('../utils/integration-helpers')
const { findText, click, clickable, signIntoTerra, dismissNotifications } = require('../utils/integration-utils')


const testRegisterUserFn = withRegisteredUser(async ({ page, testUrl, token }) => {
  await page.goto(testUrl)
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await dismissNotifications(page)
  await findText(page, 'To get started, click Create a New Workspace')
})

const testRegisterUser = {
  name: 'register-user',
  fn: testRegisterUserFn
}

module.exports = { testRegisterUser }
