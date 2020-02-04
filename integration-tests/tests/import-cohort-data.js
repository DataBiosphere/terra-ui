const { withWorkspace } = require('../utils/integration-helpers')
const { findInGrid, click, clickable, fillIn, findIframe, input, signIntoTerra, select, svgText, waitForNoSpinners, findElement } = require('../utils/integration-utils')


const cohortName = `terra-ui-test-cohort`

const testImportCohortDataFn = withWorkspace(async ({ config, page, workspaceName }) => {
  const { testUrl } = config

  await page.goto(testUrl)
  await signIntoTerra(page)
  await click(page, clickable({ textContains: 'Browse Data' }))
  await click(page, clickable({ textContains: '1000 Genomes Low Coverage' }))

  const frame = await findIframe(page)
  await click(frame, svgText({ textContains: 'Has WGS Low' }))
  await click(frame, clickable({ textContains: 'Save cohort' }))
  await fillIn(frame, input({ placeholder: 'cohort name' }), cohortName)
  await click(frame, clickable({ text: 'Save' }))

  await findElement(page, clickable({ textContains: 'an existing workspace' }))
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'an existing workspace' }))
  await select(page, 'Select a workspace', workspaceName)
  await click(page, clickable({ text: 'Import' }))
  await click(page, clickable({ textContains: 'cohort' }))
  await findInGrid(page, '1000 Genomes')
  await findInGrid(page, cohortName)
})

const testImportCohortData = {
  name: 'import cohort data',
  fn: testImportCohortDataFn
}

module.exports = { testImportCohortData }
