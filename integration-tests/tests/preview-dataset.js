const _ = require('lodash/fp')
const { checkbox, click, clickable, findText, findTableCellText, getTableCellPath, getTableHeaderPath, waitForNoSpinners } = require('../utils/integration-utils')
const { enableDataCatalog } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')

const datasetName = 'Cell hashing with barcoded antibodies enables multiplexing and doublet detection for single cell genomics'

const testPreviewDatasetFn = _.flow(
  withUserToken
)(async ({ testUrl, page, token }) => {
  await enableDataCatalog(page, testUrl, token)
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
})

const testPreviewDataset = {
  name: 'preview-dataset',
  fn: testPreviewDatasetFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testPreviewDataset }
