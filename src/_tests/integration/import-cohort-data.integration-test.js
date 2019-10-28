const { findInGrid, exactClick, click, findIframe, findText, select } = require('./integration-utils')
const dataExplorer = require('./data-explorer-utils')


jest.setTimeout(10000)

const workspace = process.env.WORKSPACE

test.skip('integration', async () => {
  const cohortName = `terra-ui-test-cohort`

  await page.goto('http://localhost:3000')
  await click(page, 'Browse Data')
  await click(page, '1000 Genomes Low Coverage')

  const frame = await findIframe(page)
  await dataExplorer.clickTextInAnyNS(frame, 'Has WGS Low Cov')
  await click(frame, 'Save cohort')
  await dataExplorer.fillIn(frame, 'name', cohortName)
  await dataExplorer.click(frame, 'Save')

  await findText(page, 'requires a Google Account')
  await page.evaluate(token => window.forceSignIn(token), process.env.TERRA_TOKEN)

  await select(page, 'Select a workspace', workspace)
  await exactClick(page, 'Import')
  await click(page, 'cohort')
  await findInGrid(page, '1000 Genomes')
  await findInGrid(page, cohortName)
}, 60 * 10000)
