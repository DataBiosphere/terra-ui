// This test is owned by the Workspaces Team.
const _ = require('lodash/fp')
const { clickNavChildAndLoad, viewWorkspaceDashboard, withWorkspace } = require('../utils/integration-helpers')
const { assertNavChildNotFound, findText } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const testGoogleWorkspace = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, token, testUrl, workspaceName }) => {
  await page.goto(testUrl)
  await viewWorkspaceDashboard(page, token, workspaceName)
  await findText(page, 'About the workspace')
  // Click on each of the expected tabs
  await clickNavChildAndLoad(page, 'data')
  await clickNavChildAndLoad(page, 'notebooks')
  await clickNavChildAndLoad(page, 'workflows')
  await clickNavChildAndLoad(page, 'job history')
})

const googleWorkspaceDashboard = {
  name: 'google-workspace',
  fn: testGoogleWorkspace
}

const setAjaxMockValues = async (testPage, namespace, name, workspaceDescription) => {
  const workspaceInfo = {
    attributes: { description: workspaceDescription },
    authorizationDomain: [],
    bucketName: '',
    createdBy: 'dummy@email.com',
    createdDate: '2022-04-12T18:12:25.912Z',
    googleProject: '',
    isLocked: false,
    lastModified: '2022-04-12T18:12:26.199Z',
    name,
    namespace,
    workspaceId: '95accxxx-4c68-4e60-9c2e-c0863af11xxx',
    workspaceVersion: 'v2'
  }
  const azureWorkspacesListResult = [{
    accessLevel: 'OWNER',
    public: false,
    workspace: workspaceInfo,
    workspaceSubmissionStats: { runningSubmissionsCount: 0 }
  }]

  const azureWorkspaceDetailsResult = {
    azureContext: {
      managedResourceGroupId: 'dummy-mrg-id',
      subscriptionId: 'dummy-subscription-id',
      tenantId: 'dummy-tenant-id'
    },
    workspaceSubmissionStats: { runningSubmissionsCount: 0 },
    accessLevel: 'OWNER',
    owners: ['dummy@email.comm'],
    workspace: workspaceInfo,
    canShare: true,
    canCompute: true
  }

  return await testPage.evaluate((azureWorkspacesListResult, azureWorkspaceDetailsResult, namespace, name) => {
    const detailsUrl = new RegExp(`api/workspaces/${namespace}/${name}[^/](.*)`, 'g')
    const submissionsUrl = new RegExp(`api/workspaces/${namespace}/${name}/submissions(.*)`, 'g')
    const tagsUrl = new RegExp(`api/workspaces/${namespace}/${name}/tags(.*)`, 'g')

    window.ajaxOverridesStore.set([
      {
        filter: { url: /api\/workspaces\/saturn-integration-test-dev(.*)/ },
        fn: () => () => Promise.resolve(new Response(JSON.stringify([azureWorkspaceDetailsResult]), { status: 200 }))
      },
      {
        filter: { url: tagsUrl },
        fn: () => () => Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      },
      {
        filter: { url: submissionsUrl },
        fn: () => () => Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      },
      {
        filter: { url: detailsUrl },
        fn: () => () => Promise.resolve(new Response(JSON.stringify(azureWorkspaceDetailsResult), { status: 200 }))
      },
      {
        filter: { url: /api\/workspaces[^/](.*)/ },
        fn: () => () => Promise.resolve(new Response(JSON.stringify(azureWorkspacesListResult), { status: 200 }))
      }
    ])
  }, azureWorkspacesListResult, azureWorkspaceDetailsResult, namespace, name)
}

const testAzureWorkspace = withUserToken(async ({ page, token, testUrl }) => {
  const workspaceDescription = 'azure workspace description'
  const workspaceName = 'azure-workspace'

  // Must load page before setting mock responses.
  await page.goto(testUrl)
  await findText(page, 'View Workspaces')
  await setAjaxMockValues(page, 'azure-workspace-ns', workspaceName, workspaceDescription)

  await viewWorkspaceDashboard(page, token, workspaceName)
  await findText(page, workspaceDescription)
  // Verify tabs that currently depend on Google project ID are not present.
  await assertNavChildNotFound(page, 'data')
  await assertNavChildNotFound(page, 'notebooks')
  await assertNavChildNotFound(page, 'workflows')
  await assertNavChildNotFound(page, 'job history')
})

const azureWorkspaceDashboard = {
  name: 'azure-workspace',
  fn: testAzureWorkspace
}

module.exports = { googleWorkspaceDashboard, azureWorkspaceDashboard }
