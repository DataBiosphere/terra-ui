const { billingProject, testUrl, screenshotDir } = require('./integration-config')
const { delay, signIntoTerra } = require('./integration-utils')


const makeWorkspace = async () => {
  const ajaxPage = await browser.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage)

  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} })
  }, workspaceName, billingProject)

  console.info(`created ${workspaceName}, waiting 60s to make sure all SAM instances know about it`)

  await ajaxPage.close()

  await delay(60 * 1000)

  return workspaceName
}

const deleteWorkspace = async workspaceName => {
  const ajaxPage = await browser.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage)

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)

  console.info(`deleted ${workspaceName}`)

  await ajaxPage.close()
}

const withWorkspace = test => async () => {
  const workspaceName = 'test-workspace-51382' // await makeWorkspace()

  try {
    await test({ workspaceName })
  } catch (e) {
    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/failure-${workspaceName}.png`, fullPage: true })
    }
    throw e
  } finally {
    // await deleteWorkspace(workspaceName)
  }
}

module.exports = {
  withWorkspace
}
