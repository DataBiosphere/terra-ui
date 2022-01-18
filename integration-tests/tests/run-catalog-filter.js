const _ = require('lodash/fp')
const { signIntoTerra, click, clickable, waitForNoSpinners, input, findText, fillIn, heading, findHeading } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { dismissNotifications } = require('../utils/integration-utils')


const getDatasetCount = async page => {
  const datasetHeading = await findHeading(page, heading({ level: 2, text: 'Datasets', isDescendant: true }))
  return datasetHeading.evaluate(node => _.toNumber(_.split('Datasets', node.textContent)[1]))
}

const testCatalogFilterFn = withUserToken(async ({ testUrl, page, token }) => {
  const searchText = 'stem cell'
  const filterItem = 'Granted'

  await page.goto(testUrl)
  await waitForNoSpinners(page)

  await findText(page, 'Browse Data')

  await page.evaluate(() => window.configOverridesStore.set({ isDataBrowserVisible: true }))
  await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })

  await click(page, clickable({ textContains: 'Browse Data' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)

  await click(page, clickable({ textContains: 'browse & explore' }))
  await waitForNoSpinners(page)

  const totalDatasetSize = await getDatasetCount(page)

  // Testing filter by search text
  await fillIn(page, input({ labelContains: 'Search Datasets' }), searchText)
  await page.keyboard.press('Enter')
  const datasetSizeAfterSearch = await getDatasetCount(page)

  if (datasetSizeAfterSearch >= totalDatasetSize) {
    throw new Error(`Rows not filtered after searching for '${searchText}'`)
  }

  // Testing filter by facet
  await click(page, clickable({ text: filterItem, isDescendant: true }))
  const datasetSizeAfterFilter = await getDatasetCount(page)

  if (datasetSizeAfterFilter >= datasetSizeAfterSearch) {
    throw new Error(`Filter for '${filterItem}' was not applied to the table`)
  }
  
  // Testing filter by multiple same facets
  await click(page, clickable({ text: 'Controlled', isDescendant: true }))
  const datasetSizeAfterFilter2 = await getDatasetCount(page)
  if (datasetSizeAfterFilter2 !== 0) {
    throw new Error(`Filters for 'Controlled' should be ANDed between the same facet category in the table'`)
  }

  // Testing clearing filters
  await click(page, clickable({ textContains: 'clear' }))
  const datasetSizeAfterClear = await getDatasetCount(page)
  if (datasetSizeAfterClear !== datasetSizeAfterSearch) {
    throw new Error(`Clear Filter was not applied to the table, ${datasetSizeAfterClear}, ${datasetSizeAfterSearch}`)
  }
})

const testCatalogFilter = {
  name: 'run-catalog-filter',
  fn: testCatalogFilterFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testCatalogFilter }
