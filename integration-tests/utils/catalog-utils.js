const { enableDataCatalog } = require('../utils/integration-helpers')
const { click, clickable, checkbox, clickTableCell, delay, waitForNoSpinners } = require('../utils/integration-utils')


const eitherThrow = (testFailure, { cleanupFailure, cleanupMessage }) => {
  if (testFailure) {
    cleanupFailure && console.error(`${cleanupMessage}: ${cleanupFailure.message}`)
    throw testFailure
  } else if (cleanupFailure) {
    throw new Error(`${cleanupMessage}: ${cleanupFailure.message}`)
  }
}

//chance to dataset with asses
const linkDataToWorkspace = async (page, testUrl, token) => {
  await enableDataCatalog(page, testUrl, token)
  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  // TODO: add test data with granted access DC-321
  await clickTableCell(page, { tableName: 'dataset list', columnHeader: 'Dataset Name', text: 'Readable Catalog Snapshot 1', isDescendant: true })
  await click(page, clickable({ textContains: 'Prepare for analysis' }))
  await delay(20000)
  await waitForNoSpinners(page)
}

module.exports = { eitherThrow, linkDataToWorkspace }
