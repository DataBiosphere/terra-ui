const { withWorkspace } = require('./integration-helpers')
const { findInGrid, exactClick, click, findIframe, signIntoTerra, select } = require('./integration-utils')
const dataExplorer = require('./data-explorer-utils')


const test = withWorkspace(async ({ workspaceName }) => {
  page.setDefaultTimeout(60 * 1000)

  const cohortName = `terra-ui-test-cohort`

  await page.goto('http://localhost:3000')
  await click(page, 'Browse Data')
  await click(page, '1000 Genomes Low Coverage')

  const frame = await findIframe(page)
  await dataExplorer.clickTextInAnyNS(frame, 'Has WGS Low')
  await click(frame, 'Save cohort')
  await dataExplorer.fillIn(frame, 'name', cohortName)
  await dataExplorer.click(frame, 'Save')

  await signIntoTerra(page)

  await select(page, 'Select a workspace', workspaceName)
  await exactClick(page, 'Import')
  await click(page, 'cohort')
  await findInGrid(page, '1000 Genomes')
  await findInGrid(page, cohortName)
})

module.exports = test
