const { billingProject, testUrl } = require('./integration-config')
const { signIntoTerra } = require('./integration-utils')


const makeWorkspace = async () => {
  await page.goto(testUrl)
  await signIntoTerra(page)

  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  await page.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} })
  }, workspaceName, billingProject)

  console.info(`created ${workspaceName}, waiting 60s to make sure all SAM instances know about it`)

  await new Promise(resolve => setTimeout(resolve, 60 * 1000))

  return workspaceName
}

const deleteWorkspace = async workspaceName => {
  await page.goto(testUrl)
  await signIntoTerra(page)

  await page.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)
}

const withWorkspace = test => async () => {
  await page.goto(testUrl)
  await signIntoTerra(page)

  const workspaceName = await makeWorkspace()

  let error
  try {
    await test({ workspaceName })
  } catch (e) {
    error = e
  } finally {
    await deleteWorkspace(workspaceName)
    console.info(`deleted ${workspaceName}`)
  }

  if (error) {
    throw error
  }
}

module.exports = {
  withWorkspace
}
