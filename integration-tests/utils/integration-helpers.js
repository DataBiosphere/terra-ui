const { billingProject, testUrl } = require('./integration-config')
const { signIntoTerra } = require('./integration-utils')


const makeWorkspace = async () => {
  const ajaxPage = await browser.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage)

  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} })
  }, workspaceName, billingProject)

  await ajaxPage.close()

  console.info(`created ${workspaceName}, waiting 60s to make sure all SAM instances know about it`)

  await new Promise(resolve => setTimeout(resolve, 60 * 1000))

  return workspaceName
}

const deleteWorkspace = async workspaceName => {
  const ajaxPage = await browser.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage)

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)

  await ajaxPage.close()
}

const withWorkspace = test => async () => {
  const workspaceName = await makeWorkspace()

  try {
    await test({ workspaceName })
  } catch (e) {
    throw e
  } finally {
    await deleteWorkspace(workspaceName)
    console.info(`deleted ${workspaceName}`)
  }
}

module.exports = {
  withWorkspace
}
