// This test is owned by the Workspaces Team.
const _ = require('lodash/fp')
const { clickNavChildAndLoad, overrideConfig, viewWorkspaceDashboard, withWorkspace } = require('../utils/integration-helpers')
const {
  assertNavChildNotFound, assertTextNotFound, click, clickable, dismissNotifications, findElement, findText, noSpinnersAfter
} = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const workspaceDashboardPage = (testPage, testUrl, token, workspaceName) => {
  return {
    visit: async (loadUrl = true) => {
      if (loadUrl) {
        await testPage.goto(testUrl)
      }
      await viewWorkspaceDashboard(testPage, token, workspaceName)
    },

    assertDescription: async expectedDescription => {
      await findText(testPage, expectedDescription)
    },

    assertCloudInformation: async expectedTextItems => {
      await click(testPage, clickable({ text: 'Cloud information' }))
      await Promise.all(_.map(async item => await findText(testPage, item), expectedTextItems))
    },

    assertReadOnly: async () => {
      await findText(testPage, 'Workspace is read only')
    },

    assertWorkspaceMenuItems: async expectedMenuItems => {
      await dismissNotifications(testPage)
      await click(testPage, clickable({ text: 'Workspace Action Menu' }))
      await Promise.all(_.map(async ({ label, tooltip }) => {
        if (!!tooltip) {
          await findElement(testPage, clickable({ textContains: label, isEnabled: false }))
          await findText(testPage, tooltip)
        } else {
          await findElement(testPage, clickable({ textContains: label }))
        }
      }, expectedMenuItems))
    },

    assertLockWorkspace: async () => {
      await dismissNotifications(testPage)
      await assertTextNotFound(testPage, 'Workspace is locked')
      await click(testPage, clickable({ text: 'Workspace Action Menu' }))
      await click(testPage, clickable({ textContains: 'Lock' }))
      await noSpinnersAfter(testPage, { action: () => click(testPage, clickable({ text: 'Lock Workspace' })) })
      await findText(testPage, 'Workspace is locked')
    },

    assertUnlockWorkspace: async () => {
      await dismissNotifications(testPage)
      await findText(testPage, 'Workspace is locked')
      await click(testPage, clickable({ text: 'Workspace Action Menu' }))
      await click(testPage, clickable({ textContains: 'Unlock' }))
      await noSpinnersAfter(testPage, { action: () => click(testPage, clickable({ text: 'Unlock Workspace' })) })
      await assertTextNotFound(testPage, 'Workspace is locked')
    },

    assertTabs: async (expectedTabs, enabled) => {
      await Promise.all(_.map(async tab => {
        await (enabled ? clickNavChildAndLoad(testPage, tab) : assertNavChildNotFound(testPage, tab))
      }, expectedTabs))
    }
  }
}

const testGoogleWorkspace = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, token, testUrl, workspaceName }) => {
  const dashboard = workspaceDashboardPage(page, testUrl, token, workspaceName)
  await dashboard.visit()
  await dashboard.assertDescription('About the workspace')

  // Check selected items in cloud information
  const currentDate = new Date().toLocaleDateString()
  await dashboard.assertCloudInformation(['Cloud NameGoogle Cloud Platform', `Bucket SizeUpdated on ${currentDate}0 B`])

  // Test locking and unlocking the workspace
  await dashboard.assertLockWorkspace()
  await dashboard.assertUnlockWorkspace()

  // Verify other Workspace menu items are in correct state (all will be enabled).
  await dashboard.assertWorkspaceMenuItems([{ label: 'Clone' }, { label: 'Share' }, { label: 'Delete' }, { label: 'Lock' }])

  // Click on each of the expected tabs
  await dashboard.assertTabs(['data', 'notebooks', 'workflows', 'job history'], true)

  // Verify Analyses tab not present (config override is not set)
  await dashboard.assertTabs(['analyses'], false)
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
    accessLevel: 'READER',
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
    accessLevel: 'READER',
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
      },
      {
        filter: { url: /api\/v2\/runtimes(.*)/ }, // Needed to prevent errors from the Runtime (IA) component that will be going away.
        fn: () => () => Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
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
  await overrideConfig(page, { isAnalysisTabVisible: true })
  await setAjaxMockValues(page, 'azure-workspace-ns', workspaceName, workspaceDescription)

  const dashboard = workspaceDashboardPage(page, testUrl, token, workspaceName)
  await dashboard.visit(false)
  await dashboard.assertDescription(workspaceDescription)

  // Check cloud information
  await dashboard.assertCloudInformation(['Cloud NameMicrosoft Azure', 'Resource Group IDdummy-mrg-id'])

  // READER permissions only
  await dashboard.assertReadOnly()

  // Verify workspace tooltips on Workspace menu items (all will be disabled due to Azure workspace + READER permissions).
  await dashboard.assertWorkspaceMenuItems([
    { label: 'Clone', tooltip: 'Cloning is not currently supported on Azure Workspaces' },
    { label: 'Share', tooltip: 'Sharing is not currently supported on Azure Workspaces' },
    { label: 'Lock', tooltip: 'You have not been granted permission to lock this workspace' },
    { label: 'Delete', tooltip: 'You have not been granted permission to lock this workspace' }
  ])

  // Verify tabs that currently depend on Google project ID are not present.
  await dashboard.assertTabs(['data', 'notebooks', 'workflows', 'job history'], false)

  // Verify Analyses tab is present (config override is set)
  await dashboard.assertTabs(['analyses'], true)
})

const azureWorkspaceDashboard = {
  name: 'azure-workspace',
  fn: testAzureWorkspace
}

module.exports = { googleWorkspaceDashboard, azureWorkspaceDashboard }
