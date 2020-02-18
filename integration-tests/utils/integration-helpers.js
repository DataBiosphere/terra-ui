const { billingProject, testUrl } = require('./integration-config')
const { signIntoTerra, clickable, click, dismissNotifications, fillIn, input } = require('./integration-utils')
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

const deleteWorkspace = async ({ context, workspaceName, token }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage, token)

  await ajaxPage.evaluate((name, billingProject) => {
    return window.Ajax().Workspaces.workspace(billingProject, name).delete()
  }, workspaceName, billingProject)

  console.info(`deleted ${workspaceName}`)

  await ajaxPage.close()
}

const withWorkspace = test => async ({ context, token, ...args }) => {
  const workspaceName = await makeWorkspace({ context, token })

  try {
    await test({ context, token, ...args, workspaceName })
  } finally {
    await deleteWorkspace({ context, token, workspaceName })
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

const addUserToBilling = async ({ email }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage)

  await ajaxPage.evaluate((email, billingProject) => {
    return window.Ajax().Billing.project(billingProject).addUser(['User'], email)
  }, email, billingProject)
  await ajaxPage.close()
}

const removeUserFromBilling = async ({ email }) => {
  const ajaxPage = await context.newPage()

  await ajaxPage.goto(testUrl)
  await signIntoTerra(ajaxPage)

  await ajaxPage.evaluate((email, billingProject) => {
    return window.Ajax().Billing.project(billingProject).removeUser(['User'], email)
  }, email, billingProject)
  await ajaxPage.close()
}

const withBilling = test => async ({ email, ...args }) => {
  await addUserToBilling({ email })

  try {
    await test({ ...args, email })
  } finally {
    await removeUserFromBilling({ email })
  }
}

const withRegisteredUser = test => withUser(async ({ page, token, ...args }) => {
  await page.goto(testUrl)
  await click(page, clickable({ textContains: 'View Workspaces' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await fillIn(page, input({ labelContains: 'First Name' }), 'Integration')
  await fillIn(page, input({ labelContains: 'Last Name' }), 'Test')
  await click(page, clickable({ textContains: 'Register' }))
  await click(page, clickable({ textContains: 'Accept' }))

  await test({ page, token, ...args })
})

module.exports = {
  createEntityInWorkspace,
  defaultTimeout,
  withWorkspace,
  withBilling,
  withRegisteredUser
}
