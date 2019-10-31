const { click, findClickable, fillIn, select, waitForNoSpinners, signIntoTerra } = require('./integration-utils')


const test = async () => {
  page.setDefaultTimeout(60 * 1000)

  await page.goto('http://localhost:3000')
  await signIntoTerra(page)
  await click(page, 'View Workspaces')
  await findClickable(page, 'New Workspace')
  await waitForNoSpinners(page)
  await click(page, 'New Workspace')
  await fillIn(page, 'Workspace name', 'My workspace')
  await select(page, 'Billing project', 'general-dev-billing-account')
  await fillIn(page, 'Description', '# This is my workspace')
}

module.exports = test
