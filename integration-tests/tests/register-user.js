const { withRegisteredUser } = require('../utils/integration-helpers')
const { findText } = require('../utils/integration-utils')


const testRegisterUserFn = withRegisteredUser(async ({ page }) => {
  await findText(page, 'To get started, click Create a New Workspace')
})

const testRegisterUser = {
  name: 'register user',
  fn: testRegisterUserFn
}

module.exports = { testRegisterUser }
