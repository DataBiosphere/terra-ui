const _ = require('lodash/fp')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { enableDataCatalog, navigateToLibrary } = require('../utils/integration-helpers')


const testRadXCatalogFn = withUserToken(async ({ page, testUrl, token }) => {
  let testSuccess = true
  await navigateToLibrary(page, testUrl, token)
  await enableRadX(page)
  try {
    await enableDataCatalog(page)
    testSuccess = false
  } catch (e) {
    // We shouldn't be able to enable the data catalog because there shouldn't be a catalog toggle in radx
  }
  if (!testSuccess) {
    throw new Error('There should not be a catalog toggle in RADx')
  }
})

const enableRadX = async page => {
  return await page.evaluate(_ => {
    window.configOverridesStore.set({ isRadX: true })
    return window.location.reload()
  }, _)
}

registerTest({
  name: 'radx-catalog-test',
  fn: testRadXCatalogFn,
  timeout: 2 * 60 * 1000
})
