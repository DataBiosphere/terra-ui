const _ = require('lodash/fp')
const { signIntoTerra, click, clickable, waitForNoSpinners, input, findText, fillIn, getNumRowsInTable } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { dismissNotifications } = require('../utils/integration-utils')


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

  const totalRows = await getNumRowsInTable(page, 'dataset list')

  await fillIn(page, input({ labelContains: 'Search Datasets' }), searchText)
  await page.keyboard.press('Enter')

  const numRowsAfterSearch = await getNumRowsInTable(page, 'dataset list')


  if (numRowsAfterSearch === totalRows) {
    throw new Error(`Rows not filtered after searching for '${searchText}'`)
  }

  await click(page, clickable({ text: filterItem, isDescendant: true }))
  const numRowsAfterFilter = await getNumRowsInTable(page, 'dataset list')

  if (numRowsAfterFilter === numRowsAfterSearch) {
    throw new Error(`Filter for '${filterItem}' was not applied to the table`)
  }
})

const testCatalogFilter = {
  name: 'run-catalog-filter',
  fn: testCatalogFilterFn,
  timeout: 2 * 60 * 1000
}

module.exports = { testCatalogFilter }
