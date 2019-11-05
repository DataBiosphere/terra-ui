const { billingProject, testUrl } = require('./integration-config')
const { signIntoTerra } = require('./integration-utils')


const makeWorkspace = async () => {
  const page = await browser.newPage()

  await page.goto(testUrl)
  await signIntoTerra(page)

  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  await page.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} })
  }, workspaceName, billingProject)

  await page.close()

  console.info(`created ${workspaceName}, waiting 60s to make sure all SAM instances know about it`)

  await new Promise(resolve => setTimeout(resolve, 60 * 1000))

  return workspaceName
}

const deleteWorkspace = async workspaceName => {
  const page = await browser.newPage()

  await page.goto(testUrl)
  await signIntoTerra(page)

  await page.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)

  await page.close()
}

const withWorkspace = test => async () => {
  await page.goto(testUrl)
  await signIntoTerra(page)

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
