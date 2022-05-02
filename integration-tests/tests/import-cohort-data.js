const _ = require('lodash/fp')
const { withWorkspace } = require('../utils/integration-helpers')
const { findInGrid, click, clickable, dismissNotifications, fillIn, findIframe, input, signIntoTerra, select, svgText, waitForNoSpinners, findElement } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const cohortName = `terra-ui-test-cohort`

const testImportCohortDataFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, testUrl, token, workspaceName }) => {
  await signIntoTerra(page, { token, testUrl })
  await dismissNotifications(page)
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

  // Loading the workspace page now means we need to make a Google API call to
  // fetch the GCS bucket location. Wait a bit for it.
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: 'cohort' }))
  await findInGrid(page, '1000 Genomes')
  await findInGrid(page, cohortName)
})

const testImportCohortData = {
  name: 'import-cohort-data',
  fn: testImportCohortDataFn
}

module.exports = { testImportCohortData }
