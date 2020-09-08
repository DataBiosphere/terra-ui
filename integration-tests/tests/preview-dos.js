const _ = require('lodash/fp')
const { withWorkspace, createEntityInWorkspace } = require('../utils/integration-helpers')
const { withUserToken } = require('../utils/terra-sa-utils')
const { fillIn, click, clickable, input, signIntoTerra, dismissNotifications } = require('../utils/integration-utils')

const dataRepoUri = 'drs://jade.datarepo-dev.broadinstitute.org/v1_0c86170e-312d-4b39-a0a4-2a2bfaa24c7a_c0e40912-8b14-43f6-9a2f-b278144d0060'

const testEntity = {
  name: 'test_entity_1',
  entityType: 'test_entity',
  attributes: {
    file_uri: dataRepoUri
  }
}

const testPreviewDosFn = _.flow(
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
  await click(page, clickable({ textContains: dataRepoUri }))

  /*
  Run with DEVTOOLS=true or you'll get no debugger breaks!
  DEVTOOLS=true \
  HEADLESS=false \
  TERRA_SA_KEY=$(vault read --format=json secret/dsde/alpha/common/firecloud-account.pem | jq .data) \
  LYLE_SA_KEY=$(vault read --format=json secret/dsde/terra/envs/common/lyle-user-service-account-key | jq .data) \
  yarn test

  This one pauses the browser and allows you to evaluate the dom(?) in the browser, but one cannot interact with the
  browser content. In the browser click "Play" / continue to continue the test.
  await page.evaluate(() => {debugger;});

  This one is better because you can click around after pressing play in the UI.
  Back in the terminal press any key to continue the test.
  await jestPuppeteer.debug();
   */

  await jestPuppeteer.debug()
  // throw new Error('screenshot?')
})

const testPreviewDos = {
  name: 'preview-dos',
  fn: testPreviewDosFn
}

module.exports = { testPreviewDos }
