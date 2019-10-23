const { findInGrid, click, findIframe, findText, select, fillIn, waitForNoSpinners } = require('./integration-utils')
const { dataExplorer } = require('./data-explorer-utils')


jest.setTimeout(10000)

test('integration', async () => {
  const prefix = 'terra-ui-system-test'
  const workspaceName = `${prefix}-workspace-${Math.floor(Math.random() * 100000)}`
  const cohortName = `${prefix}-cohort`

  await page.goto('http://localhost:3000')

  await click(page, 'Browse Data')
  await click(page, '1000 Genomes Low Coverage')

  const frame = await findIframe(page)
  await dataExplorer.clickTextInAnyNS(frame, 'Has WGS Low Cov')
  await click(frame, 'Save cohort')
  await dataExplorer.fillIn(frame, 'name', cohortName)
  await dataExplorer.click(frame, 'Save')
  await waitForNoSpinners(page)

  await findText(page, 'requires a Google Account')
  await page.evaluate(token => window.forceSignIn(token), process.env.TERRA_TOKEN)

  await click(page, 'create a new workspace')
  await fillIn(page, 'Workspace name', workspaceName)
  await select(page, 'Billing project', 'general-dev-billing-account')
  await fillIn(page, 'Description', '# This workspace should be deleted')
  await click(page, 'Create Workspace')
  await waitForNoSpinners(page)

  await click(page, 'cohort')
  await findInGrid(page, '1000 Genomes')
  await findInGrid(page, cohortName)
}, 60 * 1000)
