const _ = require('lodash/fp')
const { signIntoTerra, checkbox, click, clickable, findText, findTableCellText, getTableCellPath, getTableHeaderPath, waitForNoSpinners } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { dismissNotifications } = require('../utils/integration-utils')

const datasetName = 'Cell hashing with barcoded antibodies enables multiplexing and doublet detection for single cell genomics'

const testPreviewDatasetFn = _.flow(
  withUserToken
)(async ({ testUrl, page, token }) => {
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
  await click(page, checkbox({ text: 'Granted', isDescendant: true}))
  await click(page, clickable({ textContains: `${datasetName}` }))
  await waitForNoSpinners(page)
  await findText(page, 'Contributors')
  await click(page, clickable({ textContains: 'Preview data' }))
  await waitForNoSpinners(page)

  const previewTableName = 'Cell Suspension Preview Data'
  await findTableCellText(page, getTableHeaderPath(previewTableName, 1), 'cell_suspension_id')
  await findTableCellText(page, getTableHeaderPath(previewTableName, 2), 'version')
  await findTableCellText(page, getTableHeaderPath(previewTableName, 3), 'content')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 1), 'f0caec4a-2a37-4895-8304-83d0fd0da588')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 2), '1558104905.862')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 3), 'View JSON')
  await click(page, clickable({ textContains: 'View JSON'  }))
  await findText(page, 'describedBy')
  await page.keyboard.press('Escape')

  // Click on a table with no data
  await click(page, clickable({ text: 'data type', isDescendant: true }))
  await click(page, clickable({ text: 'Analysis File'}))
  await waitForNoSpinners(page)
  await findText(page, 'No Data')
})

const testPreviewDataset = {
  name: 'preview-dataset',
  fn: testPreviewDatasetFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testPreviewDataset }
