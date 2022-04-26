const { enableDataCatalog } = require('../utils/integration-helpers')
const { click, clickable, checkbox, clickTableCell, noSpinnersAfter } = require('../utils/integration-utils')


const eitherThrow = (testFailure, { cleanupFailure, cleanupMessage }) => {
  if (testFailure) {
    cleanupFailure && console.error(`${cleanupMessage}: ${cleanupFailure.message}`)
    throw testFailure
  } else if (cleanupFailure) {
    throw new Error(`${cleanupMessage}: ${cleanupFailure.message}`)
  }
}

const linkDataToWorkspace = async (page, testUrl, token) => {
  await enableDataCatalog(page, testUrl, token)
  await click(page, clickable({ textContains: 'browse & explore' }))
  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  await clickTableCell(page, { tableName: 'dataset list', columnHeader: 'Dataset Name', textContains: 'Discoverable Catalog Snapshot 1' })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Link to a workspace' })) })
}

module.exports = { eitherThrow, linkDataToWorkspace }
