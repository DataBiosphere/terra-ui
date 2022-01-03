const _ = require('lodash/fp')
const { defaultTimeout } = require('../utils/integration-helpers')
const { withScreenshot, withPageLogging } = require('../utils/integration-utils')
const envs = require('../utils/terra-envs')


const {
  BILLING_PROJECT: billingProject,
  ENVIRONMENT: environment = 'local',
  SNAPSHOT_COLUMN_NAME: snapshotColumnName,
  SNAPSHOT_ID: snapshotId,
  SNAPSHOT_TABLE_NAME: snapshotTableName,
  TEST_URL: testUrl,
  WORKFLOW_NAME: workflowName = 'echo_to_file'
} = process.env

const targetEnvParams = _.merge({ ...envs[environment] }, { billingProject, snapshotColumnName, snapshotId, snapshotTableName, testUrl, workflowName })

const registerTest = ({ fn, name, timeout = defaultTimeout }) => {
  return test(
    name,
    () => withPageLogging(withScreenshot(name)(fn))({ context, page, ...targetEnvParams }),
    timeout
  )
}

module.exports = { registerTest }
