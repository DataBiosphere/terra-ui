const { navigateToDataCatalog } = require('../utils/integration-helpers')
const { click, clickable, checkbox, clickTableCell, noSpinnersAfter } = require('../utils/integration-utils')


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
  await navigateToDataCatalog(page, testUrl, token)
  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  // TODO: add test data with granted access DC-321
  await clickTableCell(page, { tableName: 'dataset list', columnHeader: 'Dataset Name', text: 'Readable Catalog Snapshot 1', isDescendant: true })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Prepare for analysis' })) })
}

module.exports = { eitherThrow, linkDataToWorkspace }
