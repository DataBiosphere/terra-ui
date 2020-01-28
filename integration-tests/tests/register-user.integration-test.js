const { testUrl } = require('../utils/integration-config')
const { withUser } = require('../utils/integration-helpers')
const { findText, click, clickable, fillIn, input, signIntoTerra, waitForNoSpinners } = require('../utils/integration-utils')


const testRegisterUserFn = withUser(async ({ context, token }) => {
  const page = await context.newPage()

  page.setDefaultTimeout(7000)
  await page.goto(testUrl)
  await signIntoTerra(page, token)
  await fillIn(page, input({ labelContains: 'First Name' }), 'Integration')
  await fillIn(page, input({ labelContains: 'Last Name' }), 'Test')
  await click(page, clickable({ textContains: 'Register' }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'Accept' }))
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await findText(page, 'To get started, click Create a New Workspaceeee')
})

const testRegisterUser = {
  name: 'register user',
  fn: testRegisterUserFn
}

module.exports = { testRegisterUser }
