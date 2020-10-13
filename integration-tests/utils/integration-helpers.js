const _ = require('lodash/fp')

const { signIntoTerra } = require('./integration-utils')
const { fetchLyle } = require('./lyle-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const defaultTimeout = 5 * 60 * 1000

const withSignedInPage = fn => async options => {
  const { context, testUrl, token } = options
  const page = await context.newPage()
  try {
    await page.goto(testUrl)
    await signIntoTerra(page, token)
    return await fn({ ...options, page })
  } finally {
    await page.close()
  }
}

const makeWorkspace = withSignedInPage(async ({ page, billingProject }) => {
  const workspaceName = `test-workspace-${Math.floor(Math.random() * 100000)}`

  await page.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} })
  }, workspaceName, billingProject)

  console.info(`created workspace: ${workspaceName}`)

  return workspaceName
})

const deleteWorkspace = withSignedInPage(async ({ page, billingProject, workspaceName }) => {
  await page.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)

  console.info(`deleted workspace: ${workspaceName}`)
})

const withWorkspace = test => async options => {
  const workspaceName = await makeWorkspace(options)

  try {
    await test({ ...options, workspaceName })
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

const withUser = test => async args => {
  const { email, token } = await makeUser()

  try {
    await test({ ...args, email, token })
  } finally {
    await fetchLyle('delete', email)
  }
}

const addUserToBilling = _.flow(withSignedInPage, withUserToken)(async ({ page, billingProject, email }) => {
  await page.evaluate((email, billingProject) => {
    return window.Ajax().Billing.project(billingProject).addUser(['User'], email)
  }, email, billingProject)

  console.info(`added user to: ${billingProject}`)
})

const removeUserFromBilling = _.flow(withSignedInPage, withUserToken)(async ({ page, billingProject, email }) => {
  await page.evaluate((email, billingProject) => {
    return window.Ajax().Billing.project(billingProject).removeUser(['User'], email)
  }, email, billingProject)

  console.info(`removed user from: ${billingProject}`)
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

const deleteRuntimes = _.flow(withSignedInPage, withUserToken)(async ({ page, billingProject, email }) => {
  const deletedRuntimes = await page.evaluate(async (billingProject, email) => {
    const runtimes = await window.Ajax().Runtimes.list({ googleProject: billingProject, creator: email })
    return Promise.all(_.map(async runtime => {
      await window.Ajax().Runtimes.runtime(runtime.googleProject, runtime.runtimeName).delete(true) // true = also delete persistent disk
      return runtime.runtimeName
    }, _.remove({ status: 'Deleting' }, runtimes)))
  }, billingProject, email)
  console.info(`deleted runtimes: ${deletedRuntimes}`)
})

const registerUser = withSignedInPage(async ({ page }) => {
  await page.evaluate(async () => {
    await window.Ajax().User.profile.set({ firstName: 'Integration', lastName: 'Test', contactEmail: 'me@example.com' })
    await window.Ajax().User.acceptTos()
  })
})

const withRegisteredUser = test => withUser(async options => {
  await registerUser(options)
  await test(options)
})

module.exports = {
  createEntityInWorkspace,
  defaultTimeout,
  withWorkspace,
  withBilling,
  withUser,
  withRegisteredUser
}
