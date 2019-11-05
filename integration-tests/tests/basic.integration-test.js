const { testUrl } = require('../utils/integration-config')
const { click, findClickable, fillIn, select, waitForNoSpinners, signIntoTerra } = require('../utils/integration-utils')


test('basic', async () => {
  await page.goto(testUrl)
  await signIntoTerra(page)
  await click(page, 'View Workspaces')
  await findClickable(page, 'New Workspace')
  await waitForNoSpinners(page)
  await click(page, 'New Workspace')
  await fillIn(page, 'Workspace name', 'My workspace')
  await select(page, 'Billing project', 'general-dev-billing-account')
  await fillIn(page, 'Description', '# This is my workspace')
}, 5 * 60 * 1000)
