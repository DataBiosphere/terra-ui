const rawConsole = require('console')
const _ = require('lodash/fp')
const uuid = require('uuid')

const { click, clickable, dismissNotifications, findText, signIntoTerra, waitForNoSpinners } = require('./integration-utils')
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

const clipToken = str => str.toString().substr(-10, 10)

const testWorkspaceNamePrefix = 'terra-ui-test-workspace-'
const getTestWorkspaceName = () => `${testWorkspaceNamePrefix}${uuid.v4()}`

const makeWorkspace = withSignedInPage(async ({ page, billingProject }) => {
  const workspaceName = getTestWorkspaceName()
  try {
    await page.evaluate((name, billingProject) => {
      return window.Ajax().Workspaces.create({ namespace: billingProject, name, attributes: {} })
    }, workspaceName, billingProject)

    rawConsole.info(`Created workspace: ${workspaceName}`)
  } catch (e) {
    throw Error(`Failed to create workspace: ${workspaceName} with billing project ${billingProject}`)
  }
  return workspaceName
})

const deleteWorkspace = withSignedInPage(async ({ page, billingProject, workspaceName }) => {
  try {
    await page.evaluate((name, billingProject) => {
      return window.Ajax().Workspaces.workspace(billingProject, name).delete()
    }, workspaceName, billingProject)

    rawConsole.info(`Deleted workspace: ${workspaceName}`)
  } catch (e) {
    throw Error(`Failed to delete workspace: ${workspaceName} with billing project ${billingProject}`)
  }
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

const checkBucketAccess = async (page, billingProject, workspaceName, accessLevel = 'OWNER') => {
  const details = await page.evaluate((billingProject, workspaceName) => {
    return window.Ajax().Workspaces.workspace(billingProject, workspaceName).details()
  }, billingProject, workspaceName)
  const bucketName = details.workspace.bucketName
  rawConsole.info(`Checking workspace access for ${billingProject}, ${workspaceName}, ${bucketName}.`)
  // Try polling for workspace bucket access to be available.
  await page.waitForFunction(async (billingProject, workspaceName, bucketName, accessLevel) => {
    try {
      await window.Ajax().Workspaces.workspace(billingProject, workspaceName).checkBucketAccess(billingProject, bucketName, accessLevel)
      return true
    } catch (e) { return false }
  }, { timeout: 60000, polling: 500 }, billingProject, workspaceName, bucketName, accessLevel)
}

const makeUser = async () => {
  const { email } = await fetchLyle('create')
  const { accessToken: token } = await fetchLyle('token', email)
  rawConsole.info(`created a user with token: ...${clipToken(token)}`)
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
    return window.Ajax().Billing.addProjectUser(billingProject, ['User'], email)
  }, email, billingProject)

  rawConsole.info(`added user to: ${billingProject}`)

  const userList = await page.evaluate(billingProject => {
    return window.Ajax().Billing.listProjectUsers(billingProject)
  }, billingProject)

  const billingUser = _.find({ email }, userList)

  rawConsole.info(`test user was added to the billing project with the role: ${!!billingUser && billingUser.role}`)
})

const removeUserFromBilling = _.flow(withSignedInPage, withUserToken)(async ({ page, billingProject, email }) => {
  await page.evaluate((email, billingProject) => {
    return window.Ajax().Billing.removeProjectUser(billingProject, ['User'], email)
  }, email, billingProject)

  rawConsole.info(`removed user from: ${billingProject}`)
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
  rawConsole.info(`deleted runtimes: ${deletedRuntimes}`)
})

const registerUser = withSignedInPage(async ({ page, token }) => {
  // TODO: make this available to all puppeteer browser windows
  rawConsole.info(`token of user in registerUser(): ...${clipToken(token)}`)
  await page.evaluate(() => {
    window.catchErrorResponse = async fn => {
      try {
        await fn()
      } catch (e) {
        if (e instanceof Response) {
          const text = await e.text()
          const headers = e.headers
          const headerAuthToken = headers.get('authorization') ?
            `...${clipToken(headers.get('authorization').toString())}` :
            headers.get('authorization')
          throw new Error(`Failed to Ajax: ${e.url} authorization header was: ${headerAuthToken} and status of: ${e.status}: ${text}`)
        } else {
          throw e
        }
      }
    }
  })
  await page.evaluate(async () => {
    await window.catchErrorResponse(async () => {
      await window.Ajax().User.profile.set({ firstName: 'Integration', lastName: 'Test', contactEmail: 'me@example.com' })
      await window.Ajax().User.acceptTos()
      await window.Ajax().User.acceptSamTos()
    })
  })
})

const withRegisteredUser = test => withUser(async options => {
  await registerUser(options)
  await test(options)
})

const overrideConfig = async (page, configToPassIn) => {
  await page.evaluate(configPassedIn => window.configOverridesStore.set(configPassedIn), configToPassIn)
  await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
}

const enableDataCatalog = async (page, testUrl, token) => {
  await page.goto(testUrl)
  await waitForNoSpinners(page)

  await findText(page, 'Browse Data')
  await overrideConfig(page, { isDataBrowserVisible: true })

  await click(page, clickable({ textContains: 'Browse Data' }))
  await signIntoTerra(page, token)
  await dismissNotifications(page)
}

module.exports = {
  checkBucketAccess,
  createEntityInWorkspace,
  defaultTimeout,
  enableDataCatalog,
  testWorkspaceNamePrefix,
  overrideConfig,
  testWorkspaceName: getTestWorkspaceName,
  withWorkspace,
  withBilling,
  withUser,
  withRegisteredUser
}
