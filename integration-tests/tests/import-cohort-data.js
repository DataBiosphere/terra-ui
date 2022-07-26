const _ = require('lodash/fp')
const { withWorkspace } = require('../utils/integration-helpers')
const { findInGrid, click, clickable, fillIn, findIframe, input, signIntoTerra, select, svgText, waitForNoSpinners, findElement } = require(
  '../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const cohortName = `terra-ui-test-cohort`

const testImportCohortDataFn = _.flow(
  // withWorkspace,
  // withUserToken
)(async ({ page, testUrl, token, workspaceName }) => {
  await click(page, clickable({ textContains: 'Browse Data' }))
})

registerTest({
  name: 'import-cohort-data',
  fn: testImportCohortDataFn
})
