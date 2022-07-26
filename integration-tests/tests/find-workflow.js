const _ = require('lodash/fp')
const firecloud = require('../utils/firecloud-utils')
const { withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, findElement, findText, gotoPage, signIntoTerra } = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const testFindWorkflowFn = _.flow(
  //withWorkspace,
  //withUserToken
)(async ({ billingProject, page, testUrl, token, workflowName, workspaceName }) => {
  await findText(page, 'inputs')
})

registerTest({
  name: 'find-workflow',
  fn: testFindWorkflowFn
})
