const _ = require('lodash/fp')
const { withWorkspace, createEntityInWorkspace } = require('../utils/integration-helpers')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { findText, navChild, fillIn, click, clickable, elementInDataTableRow, waitForNoSpinners, input, signIntoTerra } = require(
  '../utils/integration-utils')


const testPreviewDrsUriFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ billingProject, page, testUrl, token, workspaceName }) => {
  const testEntity = {
    name: 'test_entity_1',
    entityType: 'test_entity',
    attributes: {
      file_uri: 'drs://jade.datarepo-dev.broadinstitute.org/v1_0c86170e-312d-4b39-a0a4-2a2bfaa24c7a_c0e40912-8b14-43f6-9a2f-b278144d0060'
    }
  }

  await signIntoTerra(page, { token, testUrl })

  await createEntityInWorkspace(page, billingProject, workspaceName, testEntity)

  await click(page, clickable({ textContains: 'View Workspaces' }))
  await waitForNoSpinners(page)
  await fillIn(page, input({ placeholder: 'Search by keyword' }), workspaceName)
  await click(page, clickable({ textContains: workspaceName }))

  await click(page, navChild('data'))

  // Loading the workspace page now means we need to make a Google API call to
  // fetch the GCS bucket location. Wait a bit for it.
  await waitForNoSpinners(page)
  await click(page, clickable({ textContains: testEntity.entityType }))
  await click(page, elementInDataTableRow(testEntity.name, testEntity.attributes.file_uri))
  await waitForNoSpinners(page)
  await findText(page, 'Filename')
  await findText(page, 'File size')
})

registerTest({
  name: 'preview-drs-uri',
  fn: testPreviewDrsUriFn
})
