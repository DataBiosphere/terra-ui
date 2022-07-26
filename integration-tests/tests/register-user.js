const { withUser } = require('../utils/integration-helpers')
const { fillIn, findText, click, clickable, input, signIntoTerra } = require('../utils/integration-utils')
const { fillInReplace, gotoPage } = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')


const testRegisterUserFn = withUser(async ({ page, testUrl, token }) => {
  await findText(page, 'To get started, Create a New Workspace')
})

registerTest({
  name: 'register-user',
  fn: testRegisterUserFn
})
