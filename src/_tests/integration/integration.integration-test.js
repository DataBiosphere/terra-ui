const { click, findClickable, fillIn, select, waitForNoSpinners, signIntoTerra } = require('./integration-utils')


test('integration', async () => {
  await page.goto('http://localhost:3000')
  await click(page, 'View Workspaces')
  await signIntoTerra(page)
  await findClickable(page, 'New Workspace')
  await waitForNoSpinners(page)
  await click(page, 'New Workspace')
  await fillIn(page, 'Workspace name', 'My workspace')
  await select(page, 'Billing project', 'general-dev-billing-account')
  await fillIn(page, 'Description', '# This is my workspace')
}, 60 * 1000)
