// This test is owned by the Workspaces Team.
const _ = require('lodash/fp')
const { viewWorkspaceDashboard, withWorkspace } = require('../utils/integration-helpers')
const {
  assertNavChildNotFound, assertTextNotFound, click, clickable, findText, gotoPage, navChild, verifyAccessibility
} = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const azureWarning = 'It is a violation of US Federal Policy to store any Unclassified Confidential Information (ie FISMA, FIPS-199, etc.) ' +
  'in this platform at this time. Do not put this data in this platform unless you are explicitly authorized to by the manager of the Dataset ' +
  'or you have your own agreements in place.'

const workspaceDashboardPage = (testPage, token, workspaceName) => {
  return {
    visit: async () => {
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

    assertTabs: async (expectedTabs, enabled) => {
      await Promise.all(_.map(async tab => {
        await (enabled ? testPage.waitForXPath(navChild(tab)) : assertNavChildNotFound(testPage, tab))
      }, expectedTabs))
    },

    assertAzureWarning: async () => {
      await testPage.waitForXPath(`//*[@id="azureWarningBanner"]/*[contains(text(), "${azureWarning}")]`, { visible: true })
    },
  }
}

const setGcpAjaxMockValues = async (testPage, namespace, name) => {
  return await testPage.evaluate((namespace, name) => {
    const storageCostEstimateUrl = new RegExp(`api/workspaces/${namespace}/${name}/storageCostEstimate(.*)`, 'g')

    window.ajaxOverridesStore.set([
      {
        filter: { url: storageCostEstimateUrl },
        fn: window.ajaxOverrideUtils.makeSuccess({ estimate: 'Fake Estimate', lastUpdated: Date.now() })
      },
      {
        filter: { url: /storage\/v1\/b(.*)/ }, // Bucket location response
        fn: window.ajaxOverrideUtils.makeSuccess({})
      }
    ])
  }, namespace, name)
}

const testGoogleWorkspace = _.flow(
  withWorkspace,
  withUserToken
)(async ({ page, token, testUrl, billingProject, workspaceName }) => {
  await gotoPage(page, testUrl)
  await setGcpAjaxMockValues(page, billingProject, workspaceName)
  const dashboard = workspaceDashboardPage(page, token, workspaceName)
  await dashboard.visit()
  await dashboard.assertDescription('About the workspace')

  // Check selected items in cloud information
  const currentDate = new Date().toLocaleDateString()
  await dashboard.assertCloudInformation(['Cloud NameGoogle Cloud Platform', `Bucket SizeUpdated on ${currentDate}0 B`])

  // Verify expected tabs are present.
  await dashboard.assertTabs(['data', 'analyses', 'workflows', 'job history'], true)

  // Check accessibility.
  await verifyAccessibility(page)

  // Verify that there is no Azure warning
  await assertTextNotFound(azureWarning)
})

registerTest({
  name: 'google-workspace',
  fn: testGoogleWorkspace
})

const setAzureAjaxMockValues = async (testPage, namespace, name, workspaceDescription) => {
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
    canShare: false,
    canCompute: false
  }

  const azureWorkspaceResourcesResult = {
    resources: [
      {
        metadata: {
          resourceType: 'AZURE_STORAGE_CONTAINER',
          controlledResourceMetadata: { accessScope: 'PRIVATE_ACCESS' }
        },
        resourceAttributes: { azureStorageContainer: { storageContainerName: 'private-sc-name' } }
      },
      {
        metadata: {
          resourceType: 'AZURE_STORAGE_CONTAINER',
          controlledResourceMetadata: { accessScope: 'SHARED_ACCESS' }
        },
        resourceAttributes: { azureStorageContainer: { storageContainerName: 'sc-name' } }
      }
    ]
  }

  return await testPage.evaluate((azureWorkspacesListResult, azureWorkspaceDetailsResult, azureWorkspaceResourcesResult, namespace, name, workspaceId) => {
    const detailsUrl = new RegExp(`api/workspaces/${namespace}/${name}[^/](.*)`, 'g')
    const submissionsUrl = new RegExp(`api/workspaces/${namespace}/${name}/submissions(.*)`, 'g')
    const tagsUrl = new RegExp(`api/workspaces/${namespace}/${name}/tags(.*)`, 'g')
    const workspaceResourcesUrl = new RegExp(`api/workspaces/v1/${workspaceId}/resources(.*)`, 'g')
    const workspaceSasTokenUrl = new RegExp(`api/workspaces/v1/${workspaceId}/resources/controlled/azure/storageContainer/(.*)/getSasToken`)

    window.ajaxOverridesStore.set([
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
        filter: { url: workspaceResourcesUrl },
        fn: () => () => Promise.resolve(new Response(JSON.stringify(azureWorkspaceResourcesResult), { status: 200 }))
      },
      {
        filter: { url: workspaceSasTokenUrl },
        fn: () => () => Promise.resolve(new Response(JSON.stringify({ sasToken: 'fake_token', url: 'http://storageContainerUrl.com?sasTokenParams' }), { status: 200 }))
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
  }, azureWorkspacesListResult, azureWorkspaceDetailsResult, azureWorkspaceResourcesResult, namespace, name, workspaceInfo.workspaceId)
}

const testAzureWorkspace = withUserToken(async ({ page, token, testUrl }) => {
  const workspaceDescription = 'azure workspace description'
  const workspaceName = 'azure-workspace'

  // Must load page before setting mock responses.
  await gotoPage(page, testUrl)
  await findText(page, 'View Workspaces')
  await setAzureAjaxMockValues(page, 'azure-workspace-ns', workspaceName, workspaceDescription)

  const dashboard = workspaceDashboardPage(page, token, workspaceName)
  await dashboard.visit()
  await dashboard.assertDescription(workspaceDescription)

  // Check cloud information
  await dashboard.assertCloudInformation([
    'Cloud NameMicrosoft Azure',
    'Resource Group IDdummy-mrg-id',
    'Storage Container URLhttp://storageContainerUrl.com',
    // 'Location🇺🇸 East US', depends on TOAZ-265
    'SAS URLhttp://storageContainerUrl.com?sasTokenParams'
  ])

  // READER permissions only
  await dashboard.assertReadOnly()

  // Verify tabs that currently depend on Google project ID are not present.
  await dashboard.assertTabs(['data', 'notebooks', 'workflows', 'job history'], false)

  // Verify Analyses tab is present.
  await dashboard.assertTabs(['analyses'], true)

  // Check accessibility.
  await verifyAccessibility(page)

  // Verify Azure warning is visible
  await dashboard.assertAzureWarning()
})

registerTest({
  name: 'azure-workspace',
  fn: testAzureWorkspace
})
