// This test is owned by the Data Explorer Team.
const { checkbox, click, clickable, findText, findTableCellText, getTableCellPath, getTableHeaderPath, waitForNoSpinners } = require('../utils/integration-utils')
const { enableDataCatalog } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const datasetName = 'Transcriptomic characterisation of haematopoietic stem and progenitor' +
  ' cells from human adult bone marrow, spleen and peripheral blood'

const testPreviewDatasetFn = withUserToken(async ({ testUrl, page, token }) => {
  await enableDataCatalog(page, testUrl, token)
  await click(page, clickable({ textContains: 'browse & explore' }))
  await waitForNoSpinners(page)
  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  await click(page, clickable({ textContains: `${datasetName}` }))
  await waitForNoSpinners(page)
  await findText(page, 'Contributors')
  await click(page, clickable({ textContains: 'Preview data' }))
  await waitForNoSpinners(page)

  const previewTableName = 'Analysis File Preview Data'
  await findTableCellText(page, getTableHeaderPath(previewTableName, 1), 'content')
  await findTableCellText(page, getTableHeaderPath(previewTableName, 2), 'file_id')
  await findTableCellText(page, getTableHeaderPath(previewTableName, 3), 'version')
  await findTableCellText(page, getTableHeaderPath(previewTableName, 4), 'analysis_file_id')
  await findTableCellText(page, getTableHeaderPath(previewTableName, 5), 'descriptor')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 1), 'View JSON')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 2), 'drs://jade.datarepo-dev.broadinstitute.org/v1_e0664f4e-cf09-488a-841d-4baf2cbf1507_71c2fd30-8721-437f-b884-6bae39e51206')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 3), '1612834200.0')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 4), 'dda27004-526a-54c8-bb46-01750aeb8d0d')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 5), 'View JSON')
  await click(page, clickable({ textContains: 'View JSON' }))
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
