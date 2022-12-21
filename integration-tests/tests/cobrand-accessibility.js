const _ = require('lodash/fp')
const { setGcpAjaxMockValues, withWorkspace } = require('../utils/integration-helpers')
const { gotoPage, verifyAccessibility } = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { findText } = require('../utils/integration-utils')
const { viewWorkspaceDashboard } = require('../utils/integration-helpers')


// TODO: Remove before PR'ing
// const delay = ms => {
//   return new Promise(resolve => setTimeout(resolve, ms))
// }

const testCobrandAccessibility = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, token, testUrl, billingProject, workspaceName }) => {
  await gotoPage(page, testUrl)

  // Check landing page pre-login
  await findText(page, 'Browse Data')
  await verifyAccessibility(page)

  await setGcpAjaxMockValues(page, billingProject, workspaceName)

  // await overrideConfig(page, { isRareX: true })
  // await delay(4000)
  // await verifyAccessibility(page)
  // await delay(4000)

  // Check workspace dashboard page after logging in
  await viewWorkspaceDashboard(page, token, workspaceName)
  await findText(page, 'About the workspace')
  await verifyAccessibility(page)
})

registerTest({
  name: 'cobrand-accessibility',
  fn: testCobrandAccessibility
})
