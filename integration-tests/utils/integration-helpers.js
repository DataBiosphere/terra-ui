const { delay, signIntoTerra } = require('./integration-utils')
const { fetchLyle } = require('./lyle-utils')


const defaultTimeout = 5 * 60 * 1000

const makeWorkspace = async ({ config, context }) => {
  const { billingProject, testUrl } = config
  const ajaxPage = await context.newPage()

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

const deleteWorkspace = async ({ config, context, workspaceName }) => {
  const { billingProject, testUrl } = config
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage)

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)

  console.info(`deleted ${workspaceName}`)

  await ajaxPage.close()
}

const withWorkspace = testFn => async options => {
  const workspaceName = await makeWorkspace(options)

  try {
    await testFn({ ...options, workspaceName })
  } finally {
    await deleteWorkspace({ ...options, workspaceName })
  }
}

const createEntityInWorkspace = (page, billingProject, workspaceName, testEntity) => {
  return page.evaluate((billingProject, workspaceName, testEntity) => {
    return window.Ajax().Workspaces.workspace(billingProject, workspaceName).createEntity(testEntity)
  }, billingProject, workspaceName, testEntity)
}

const makeUser = async () => {
  const { email } = await fetchLyle('create')
  const { accessToken: token } = await fetchLyle('token', email)

  return { email, token }
}

const withUser = test => async options => {
  const { email, token } = await makeUser()

  try {
    await test({ ...options, email, token })
  } finally {
    await fetchLyle('delete', email)
  }
}

module.exports = {
  createEntityInWorkspace,
  defaultTimeout,
  withUser,
  withWorkspace
}
