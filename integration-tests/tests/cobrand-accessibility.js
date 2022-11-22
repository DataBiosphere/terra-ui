const _ = require('lodash/fp')
const { withWorkspace } = require('../utils/integration-helpers')
const { gotoPage, verifyAccessibility } = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const testCobrandAccessibility = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, testUrl }) => {
  await gotoPage(page, testUrl)

  // Check accessibility.
  await verifyAccessibility(page)
})

registerTest({
  name: 'cobrand-accessibility',
  fn: testCobrandAccessibility
})
