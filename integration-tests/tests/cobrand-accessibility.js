const _ = require('lodash/fp')
const { overrideConfig, withWorkspace } = require('../utils/integration-helpers')
const { gotoPage, verifyAccessibility } = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { waitForNoSpinners, findText } = require('../utils/integration-utils')


const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const testCobrandAccessibility = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, testUrl }) => {
  await gotoPage(page, testUrl)
  await waitForNoSpinners(page)
  await findText(page, 'Browse Data')
  await verifyAccessibility(page)

  await overrideConfig(page, { isRareX: true })
  await delay(4000)
  await verifyAccessibility(page)
  await delay(4000)
})

registerTest({
  name: 'cobrand-accessibility',
  fn: testCobrandAccessibility
})
