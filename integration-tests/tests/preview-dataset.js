const { checkbox, click, clickable, findText, findTableCellText, getTableCellPath, getTableHeaderPath, waitForNoSpinners, getTableRowNumber } = require('../utils/integration-utils')
const { enableDataCatalog } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')


const datasetName = 'Readable Catalog Snapshot 1'

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

  const previewTableName = 'Participant Preview Data'

  const rownum = await getTableRowNumber(previewTableName, 'participant_id')
  console.log(rownum)

  await findTableCellText(page, getTableHeaderPath(previewTableName, 1), 'participant_id')
  await findTableCellText(page, getTableHeaderPath(previewTableName, 2), 'biological_sex')
  await findTableCellText(page, getTableHeaderPath(previewTableName, 3), 'age')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 1), 'participant1')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 2), 'male')
  await findTableCellText(page, getTableCellPath(previewTableName, 2, 3), '36')
})

const testPreviewDataset = {
  name: 'preview-dataset',
  fn: testPreviewDatasetFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
}

module.exports = { testPreviewDataset }
