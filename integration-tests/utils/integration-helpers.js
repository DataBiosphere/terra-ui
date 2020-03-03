const _ = require('lodash/fp')

const { signIntoTerra, clickable, click, dismissNotifications, fillIn, input, delay } = require('./integration-utils')
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

  console.info(`created ${workspaceName}`)

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

const addUserToBilling = withUserToken(async ({ billingProject, email, testUrl, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  console.log(billingProject)
  await ajaxPage.evaluate((email, billingProject) => {
    return window.Ajax().Billing.project(billingProject).addUser(['User'], email)
  }, email, billingProject)
  await ajaxPage.close()
})

const removeUserFromBilling = withUserToken(async ({ billingProject, email, testUrl, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  await ajaxPage.evaluate((email, billingProject) => {
    return window.Ajax().Billing.project(billingProject).removeUser(['User'], email)
  }, email, billingProject)
  await ajaxPage.close()
})

const withBilling = test => async options => {
  await addUserToBilling(options)

  try {
    await test({ ...options })
  } finally {
    await deleteCluster(options)
    await removeUserFromBilling(options)
  }
}

const trimClustersOldestFirst = _.flow(
  _.remove({ status: 'Deleting' }),
  _.sortBy('createdDate')
)

const currentCluster = _.flow(trimClustersOldestFirst, _.last)

const getCurrentCluster = withUserToken(async ({ billingProject, testUrl, token }) => {
  const ajaxPage = await context.newPage()
  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  const clusters = await ajaxPage.evaluate(billingProject => {
    return window.Ajax().Clusters.list({ googleProject: billingProject })
  }, billingProject)

  await ajaxPage.close()
  return currentCluster(clusters)
})

const deleteCluster = withUserToken(async ({ billingProject, testUrl, token }) => {
  const ajaxPage = await context.newPage()
  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  const currentC = await getCurrentCluster({ billingProject, testUrl })
  await ajaxPage.evaluate((currentC, billingProject) => {
    return window.Ajax().Clusters.cluster(billingProject, currentC.clusterName).delete()
  }, currentC, billingProject)

  await ajaxPage.close()
})

const withRegisteredUser = test => withUser(async ({ page, testUrl, token, ...args }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await click(ajaxPage, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(ajaxPage, token)
  await dismissNotifications(ajaxPage)
  await fillIn(ajaxPage, input({ labelContains: 'First Name' }), 'Integration')
  await fillIn(ajaxPage, input({ labelContains: 'Last Name' }), 'Test')
  await click(ajaxPage, clickable({ textContains: 'Register' }))
  await click(ajaxPage, clickable({ textContains: 'Accept' }))
  await delay(1000)
  await ajaxPage.close()

  await test({ page, testUrl, token, ...args })
})

module.exports = {
  createEntityInWorkspace,
  defaultTimeout,
  withWorkspace,
  withBilling,
  withRegisteredUser
}
