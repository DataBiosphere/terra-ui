const { makeWorkspace } = require('./utils/integration-helpers')
const { withUserToken } = require('./utils/terra-sa-utils')
const _ = require('lodash/fp')


module.exports = async () => {
  const workspaceData = await _.flowRight(
    withUserToken,
    makeWorkspace
  )

  global.workspaceData = workspaceData
}
