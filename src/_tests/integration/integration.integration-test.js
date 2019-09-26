const { click, findText, findClickable, fillIn, select, waitForNoSpinners } = require('./integration-utils')


test('integration', async () => {
  await page.goto('http://localhost:3000')
  await click(page, 'View Workspaces')
  await findText(page, 'requires a Google Account')
  await page.evaluate(token => window.forceSignIn(token), process.env.TERRA_TOKEN)
  await findClickable(page, 'New Workspace')
  await waitForNoSpinners(page)
  await click(page, 'New Workspace')
  await fillIn(page, 'Workspace name', 'My workspace')
  await select(page, 'Billing project', 'general-dev-billing-account')
  await fillIn(page, 'Description', '# This is my workspace')
}, 60 * 1000)
