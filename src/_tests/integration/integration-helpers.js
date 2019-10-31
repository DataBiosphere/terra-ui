const { signIntoTerra } = require('./integration-utils')


const makeWorkspace = async () => {
  await page.goto('http://localhost:3000')
  await signIntoTerra(page)

  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  console.log(workspaceName)
  await page.evaluate(name => {
    return window.Ajax().Workspaces.create({ namespace: 'general-dev-billing-account', name, attributes: {} })
  }, workspaceName)

  while (true) {
    const workspaces = await page.evaluate(() => {
      return window.Ajax().Workspaces.list(['accessLevel', 'workspace'])
    })
    console.log(workspaces.filter(({ accessLevel, workspace: { name, namespace } }) => {
      return name === workspaceName
    }))
    if (workspaces.some(({ accessLevel, workspace: { name, namespace } }) => {
      return name === workspaceName && accessLevel === 'OWNER' && namespace === 'general-dev-billing-account'
    })) {
      return workspaceName
    } else {
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

const deleteWorkspace = async workspaceName => {
  await page.goto('http://localhost:3000')
  await signIntoTerra(page)

  return page.evaluate(name => {
    return window.Ajax().Workspaces.workspace('general-dev-billing-account', name).delete()
  }, workspaceName)
}

module.exports = {
  makeWorkspace,
  deleteWorkspace
}
