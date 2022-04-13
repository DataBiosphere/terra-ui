// This cleanup "test" is owned by the Workspaces Team.
const rawConsole = require('console')
const dateFns = require('date-fns/fp')
const _ = require('lodash/fp')
const { testWorkspaceNamePrefix } = require('../utils/integration-helpers')
const { dismissNotifications, signIntoTerra } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const olderThanDays = 2

const runJanitor = withUserToken(async ({ billingProject, page, testUrl, token }) => {
  // Sign into Terra so we have the correct credentials.
  await page.goto(testUrl)
  await signIntoTerra(page, token)
  await dismissNotifications(page)

  // Delete old orphaned workspaces. These can result from local integration test runs where the
  // process was prematurely terminated, but a few also appear in alpha and staging indicating that
  // ci test runs also sometimes leak workspaces.
  const workspaces = await page.evaluate(async () => await window.Ajax().Workspaces.list())
  const oldWorkspaces = _.filter(({ workspace: { namespace, name, createdDate } }) => {
    const age = dateFns.differenceInDays(new Date(createdDate), new Date())
    // rawConsole.info(`${namespace} ${name}, age ${age} days`)
    return namespace === billingProject && _.startsWith(testWorkspaceNamePrefix, name) && age > olderThanDays
  }, workspaces)

  rawConsole.log(`Deleting ${oldWorkspaces.length} workspaces with prefix "${testWorkspaceNamePrefix}" created more than ${olderThanDays} days ago.`)

  return Promise.all(_.map(async ({ workspace: { namespace, name } }) => {
    try {
      await page.evaluate((namespace, name) => window.Ajax().Workspaces.workspace(namespace, name).delete(), namespace, name)
      rawConsole.info(`Deleted old workspace: ${name}`)
    } catch (e) {
      rawConsole.info(`Failed to delete old workspace: ${name} with billing project ${namespace}`)
    }
  }, oldWorkspaces))
})

const janitor = {
  name: 'janitor',
  fn: runJanitor
}

module.exports = { janitor }
