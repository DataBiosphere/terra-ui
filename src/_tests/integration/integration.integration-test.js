const { click, findText, findClickable, fillIn, waitForNoSpinners } = require('./integration-utils')


test('integration', async () => {
  await page.goto('http://localhost:3000')
  await click(page, 'View Workspaces')
  await findText(page, 'requires a Google Account')
  await page.evaluate(token => forceSignIn(token), process.env.TERRA_TOKEN)
  await findClickable(page, 'New Workspace')
  await waitForNoSpinners(page)
  await click(page, 'New Workspace')
  await fillIn(page, 'Workspace name', 'My workspace')
}, 60 * 1000)
