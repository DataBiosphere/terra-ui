const _ = require('lodash/fp')
const { checkbox, click, clickable, input, fillIn, heading, findHeading, findText, gotoPage, waitForNoSpinners, signIntoTerra } = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { enableDataCatalog } = require('../utils/integration-helpers')
const { setDatasetsMockValues } = require('../utils/catalog-utils')


const getDatasetCount = async page => {
  const datasetHeading = await findHeading(page, heading({ level: 2, text: 'Datasets', isDescendant: true }))
  return datasetHeading.evaluate(node => _.toNumber(_.split('Datasets', node.textContent)[1]))
}

const testCatalogFilterFn = withUserToken(async ({ testUrl, page, token }) => {
  const searchText = 'kidney'
  const filterItem = 'acoustic neuroma'
  const secondFilterItem = 'adrenal cortex adenoma'

  await gotoPage(page, testUrl)
  await waitForNoSpinners(page)

  await setDatasetsMockValues(page, ['reader'])

  await findText(page, 'Browse Data')
  await click(page, clickable({ textContains: 'Browse Data' }))
  await signIntoTerra(page, { token })
  await enableDataCatalog(page)

  await findText(page, filterItem)

  const totalDatasetSize = await getDatasetCount(page)

  // Testing filter by search text
  await fillIn(page, input({ labelContains: 'Search Datasets' }), searchText)
  await page.keyboard.press('Enter')
  const datasetSizeAfterSearch = await getDatasetCount(page)

  if (datasetSizeAfterSearch >= totalDatasetSize) {
    throw new Error(`Rows not filtered after searching for '${searchText}'`)
  }

  // Testing filter by facet
  await click(page, checkbox({ text: filterItem, isDescendant: true }))
  const datasetSizeAfterFilter = await getDatasetCount(page)

  if (datasetSizeAfterFilter >= datasetSizeAfterSearch) {
    throw new Error(`Filter for '${filterItem}' was not applied to the table`)
  }

  // Testing filter by multiple same facets
  await click(page, checkbox({ text: secondFilterItem, isDescendant: true }))
  const datasetSizeAfterFilter2 = await getDatasetCount(page)
  if (datasetSizeAfterFilter2 === 0) {
    throw new Error(`Filters should be ORed between the same facet category in the table'`)
  }

  // Testing clearing filters
  await click(page, clickable({ textContains: 'clear' }))
  const datasetSizeAfterClear = await getDatasetCount(page)
  if (datasetSizeAfterClear !== datasetSizeAfterSearch) {
    throw new Error(`Clear Filter was not applied to the table, ${datasetSizeAfterClear}, ${datasetSizeAfterSearch}`)
  }
})

registerTest({
  name: 'run-catalog-filter',
  fn: testCatalogFilterFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev', 'staging']
})
