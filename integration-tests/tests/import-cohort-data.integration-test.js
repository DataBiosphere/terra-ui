const dataExplorer = require('../utils/data-explorer-utils')
const { testUrl } = require('../utils/integration-config')
const { withWorkspace } = require('../utils/integration-helpers')
const { findInGrid, exactClick, click, findIframe, signIntoTerra, select } = require('../utils/integration-utils')


test('import cohort data', withWorkspace(async ({ workspaceName }) => {
  const cohortName = `terra-ui-test-cohort`

  await page.goto(testUrl)
  await signIntoTerra(page)
  await click(page, 'Browse Data')
  await click(page, '1000 Genomes Low Coverage')

  const frame = await findIframe(page)
  await dataExplorer.clickTextInAnyNS(frame, 'Has WGS Low')
  await click(frame, 'Save cohort')
  await dataExplorer.fillIn(frame, 'name', cohortName)
  await dataExplorer.click(frame, 'Save')

  await select(page, 'Select a workspace', workspaceName)
  await exactClick(page, 'Import')
  await click(page, 'cohort')
  await findInGrid(page, '1000 Genomes')
  await findInGrid(page, cohortName)
}), 5 * 60 * 1000)
