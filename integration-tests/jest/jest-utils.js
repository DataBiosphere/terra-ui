const _ = require('lodash/fp')
const { defaultTimeout } = require('../utils/integration-helpers')
const { withScreenshot } = require('../utils/integration-utils')
const envs = require('../utils/terra-envs')


const {
  BILLING_PROJECT: billingProject,
  ENVIRONMENT: environment = 'local',
  TEST_URL: testUrl,
  WORKFLOW_NAME: workflowName = 'echo_to_file'
} = process.env

const targetEnvParams = _.merge({ ...envs[environment] }, { billingProject, testUrl, workflowName })

const registerTest = ({ fn, name, timeout = defaultTimeout }) => {
  return test(name, () => withScreenshot(name)(fn)({ context, page, ...targetEnvParams }), timeout)
}

module.exports = { registerTest }
