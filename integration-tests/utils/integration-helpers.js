const { billingProject, testUrl } = require('./integration-config')
const { signIntoTerra } = require('./integration-utils')
const { fetchLyle } = require('./lyle-utils')


const defaultTimeout = 5 * 60 * 1000

const makeWorkspace = async ({ context, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} })
  }, workspaceName, billingProject)

  console.info(`created ${workspaceName}`)

  await ajaxPage.close()

  return workspaceName
}

const deleteWorkspace = async (workspaceName, { context, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)

  console.info(`deleted ${workspaceName}`)

  await ajaxPage.close()
}

const withWorkspace = test => async options => {
  const workspaceName = await makeWorkspace(options)

  try {
    await test({ ...options, workspaceName })
  } finally {
    await deleteWorkspace(workspaceName, options)
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

const withUser = test => async args => {
  const { email, token } = await makeUser()

  try {
    await test({ ...args, email, token })
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
