const { signIntoTerra } = require('./integration-utils')


const makeWorkspace = async () => {
  await page.goto('http://localhost:3000')
  await signIntoTerra(page)

  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  await page.evaluate(name => {
    return window.Ajax().Workspaces.create({ namespace: 'general-dev-billing-account', name, attributes: {} })
  }, workspaceName)

  console.info(`created ${workspaceName}`)

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

  await page.evaluate(name => {
    return window.Ajax().Workspaces.workspace('general-dev-billing-account', name).delete()
  }, workspaceName)
}

const withWorkspace = test => async () => {
  await page.goto('http://localhost:3000')
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
