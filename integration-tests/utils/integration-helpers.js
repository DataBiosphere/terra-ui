const _ = require('lodash/fp')

const { signIntoTerra } = require('./integration-utils')
const { fetchLyle } = require('./lyle-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const defaultTimeout = 5 * 60 * 1000

const makeWorkspace = async ({ billingProject, context, testUrl, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} })
  }, workspaceName, billingProject)

  console.info(`created workspace: ${workspaceName}`)

  await ajaxPage.close()

  return workspaceName
}

const deleteWorkspace = async (workspaceName, { billingProject, context, testUrl, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)

  console.info(`deleted workspace: ${workspaceName}`)

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

const addUserToBilling = withUserToken(async ({ billingProject, context, email, testUrl, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  await ajaxPage.evaluate((email, billingProject) => {
    return window.Ajax().Billing.project(billingProject).addUser(['User'], email)
  }, email, billingProject)

  console.info(`added user to: ${billingProject}`)

  await ajaxPage.close()
})

const removeUserFromBilling = withUserToken(async ({ billingProject, context, email, testUrl, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  await ajaxPage.evaluate((email, billingProject) => {
    return window.Ajax().Billing.project(billingProject).removeUser(['User'], email)
  }, email, billingProject)

  console.info(`removed user from: ${billingProject}`)

  await ajaxPage.close()
})

const withBilling = test => async options => {
  await addUserToBilling(options)

  try {
    await test({ ...options })
  } finally {
    await deleteRuntimes(options)
    await removeUserFromBilling(options)
  }
}

const deleteRuntimes = withUserToken(async ({ billingProject, context, email, testUrl, token }) => {
  const ajaxPage = await context.newPage()
  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  const deletedRuntimes = await ajaxPage.evaluate(async (billingProject, email) => {
    const runtimes = await window.Ajax().Clusters.list({ googleProject: billingProject, creator: email })
    return Promise.all(_.map(async runtime => {
      await window.Ajax().Clusters.cluster(runtime.googleProject, runtime.runtimeName).delete()
      return runtime.runtimeName
    }, _.remove({ status: 'Deleting' }, runtimes)))
  }, billingProject, email)
  console.info(`deleted runtimes: ${deletedRuntimes}`)

  await ajaxPage.close()
})

const withRegisteredUser = test => withUser(async args => {
  const { context, testUrl, token } = args
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)
  await ajaxPage.evaluate(async () => {
    await window.Ajax().User.profile.set({ firstName: 'Integration', lastName: 'Test', contactEmail: 'me@example.com' })
    await window.Ajax().User.acceptTos()
  })
  await ajaxPage.close()

  await test(args)
})

module.exports = {
  createEntityInWorkspace,
  defaultTimeout,
  withWorkspace,
  withBilling,
  withUser,
  withRegisteredUser
}
