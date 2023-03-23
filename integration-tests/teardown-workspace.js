const { deleteWorkspace } = require('./utils/integration-helpers')


module.exports = async () => {
  await deleteWorkspace()
}
