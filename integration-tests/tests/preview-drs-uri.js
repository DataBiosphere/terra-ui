const _ = require('lodash/fp')
const { withWorkspace, createEntityInWorkspace } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')
const { findText, fillIn, click, clickable, waitForNoSpinners, input, signIntoTerra, dismissNotifications } = require('../utils/integration-utils')

const dataRepoUri = 'drs://jade.datarepo-dev.broadinstitute.org/v1_0c86170e-312d-4b39-a0a4-2a2bfaa24c7a_c0e40912-8b14-43f6-9a2f-b278144d0060'

const testEntity = {
  name: 'test_entity_1',
  entityType: 'test_entity',
  attributes: {
    file_uri: dataRepoUri
  }
}

const testPreviewDrsUriFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ billingProject, page, testUrl, token, workspaceName }) => {
  await page.goto(testUrl)
  await signIntoTerra(page, token)
  await dismissNotifications(page)

  await createEntityInWorkspace(page, billingProject, workspaceName, testEntity)

  await click(page, clickable({ textContains: 'View Workspaces' }))
  await fillIn(page, input({ placeholder: 'SEARCH WORKSPACES' }), workspaceName)
  await click(page, clickable({ textContains: workspaceName }))
  await click(page, clickable({ textContains: 'data' }))
  await click(page, clickable({ textContains: 'test_entity (1)' }))
  await click(page, `//*[@role="grid"]//*[contains(.,"${testEntity.name}")]/following-sibling::*[contains(.,"drs://")]`)
  await waitForNoSpinners(page)
  await findText(page, 'View this file in the Google Cloud Storage Browser')
})

const testPreviewDrsUri = {
  name: 'preview-drs-uri',
  fn: testPreviewDrsUriFn
}

module.exports = { testPreviewDrsUri }
