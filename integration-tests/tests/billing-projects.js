// This test is owned by the Workspaces Team.
const _ = require('lodash/fp')
const {
  assertTextNotFound, click, clickable, findText, gotoPage, select, signIntoTerra, waitForNoSpinners, verifyAccessibility
} = require('../utils/integration-utils')
const { userEmail } = require('../utils/integration-config')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const AZURE = 'AZURE'
const GCP = 'GCP'

const billingProjectsPage = (testPage, testUrl) => {
  return {
    visit: async () => {
      // Note: not using noSpinnersAfter because this action changes the page, and
      // noSpinners after checks that a spinner appears and disappear within the same page.
      await gotoPage(testPage, `${testUrl}/#billing`)
      await findText(testPage, 'Select a Billing Project')
      await waitForNoSpinners(testPage)
    },

    selectSpendReport: async () => {
      await click(testPage, clickable({ text: 'Spend report' }))
    },

    selectMembers: async () => {
      await click(testPage, clickable({ text: 'Members' }))
    },

    selectOwners: async () => {
      await click(testPage, clickable({ text: 'Owners' }))
    },

    selectProject: (billingProjectName, cloudPlatform = GCP) => {
      const text = cloudPlatform === GCP ? `Google Cloud Platform${billingProjectName}` : `Microsoft Azure${billingProjectName}`
      return click(testPage, clickable({ text }))
    },

    selectDeleteProjectMenuOption: async projectName => {
      await click(testPage, clickable({ text: `Delete billing project ${projectName}` }))
    },

    confirmDeleteBillingProject: async () => {
      await click(testPage, clickable({ text: 'Delete billing project' }))
    },

    setSpendReportDays: async days => await select(testPage, 'Date range', `Last ${days} days`),

    assertText: async expectedText => await findText(testPage, expectedText),

    assertTextNotFound: async unexpectedText => await assertTextNotFound(testPage, unexpectedText),

    assertChartValue: async (number, workspaceName, category, cost) => {
      // This checks the accessible text for chart values.
      await testPage.waitForXPath(`(//*[@role="img"])[contains(@aria-label,"${number}. Workspace ${workspaceName}, ${category}: ${cost}.")]`)
    },

    showWorkspaceDetails: name => click(testPage, clickable({ text: `expand workspace ${name}` }))
  }
}

const setAjaxMockValues = async (testPage, ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName, azureBillingProjectName, erroredProjectVisible, spendCost, numExtraWorkspaces = 0) => {
  const spendReturnResult = {
    spendSummary: {
      cost: spendCost, credits: '2.50', currency: 'USD', endTime: '2022-03-04T00:00:00.000Z', startTime: '2022-02-02T00:00:00.000Z'
    },
    spendDetails: [
      {
        aggregationKey: 'Workspace',
        spendData: [
          {
            cost: '100', workspace: { name: 'Second Most Expensive Workspace' },
            subAggregation: {
              aggregationKey: 'Category',
              spendData: [{ cost: '90', category: 'Compute' }, { cost: '2', category: 'Storage' }, { cost: '8', category: 'Other' }]
            }
          },
          {
            cost: '1000', workspace: { name: 'Most Expensive Workspace' },
            subAggregation: {
              aggregationKey: 'Category',
              spendData: [{ cost: '900', category: 'Compute' }, { cost: '20', category: 'Storage' }, { cost: '80', category: 'Other' }]
            }
          },
          {
            cost: '10', workspace: { name: 'Third Most Expensive Workspace' },
            subAggregation: {
              aggregationKey: 'Category',
              spendData: [{ cost: '9', category: 'Compute' }, { cost: '0', category: 'Storage' }, { cost: '1', category: 'Other' }]
            }
          }
        ]
      },
      {
        aggregationKey: 'Category',
        spendData: [{ cost: '999', category: 'Compute' }, { cost: '22', category: 'Storage' }, { cost: '89', category: 'Other' }]
      }
    ]
  }

  _.forEach(() => {
    spendReturnResult.spendDetails[0].spendData.push({
      cost: '0.01', workspace: { name: 'Extra Inexpensive Workspace' },
      subAggregation: {
        aggregationKey: 'Category',
        spendData: [{ cost: '0.01', category: 'Compute' }, { cost: '0.00', category: 'Storage' }, { cost: '0.00', category: 'Other' }]
      }
    })
  }, _.range(0, numExtraWorkspaces))

  const projectListResult = _.compact([{
    projectName: ownedBillingProjectName,
    billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['Owner'], status: 'Ready', cloudPlatform: 'GCP'
  },
  erroredProjectVisible && {
    projectName: erroredBillingProjectName,
    billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['Owner'], status: 'Error', cloudPlatform: 'UNKNOWN'
  },
  {
    projectName: notOwnedBillingProjectName,
    billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['User'], status: 'Ready', cloudPlatform: 'GCP'
  },
  {
    projectName: azureBillingProjectName,
    managedAppCoordinates: { managedResourceGroupId: `${azureBillingProjectName}_mrg`, subscriptionId: 'subId', tenantId: 'tenantId' },
    invalidBillingAccount: false, roles: ['Owner'], status: 'Ready', cloudPlatform: 'AZURE', landingZoneId: 'fakeLandingZoneId'
  }])

  const ownedProjectMembersListResult = [{
    email: 'testuser1@example.com', role: 'Owner'
  },
  {
    email: 'testuser2@example.com', role: 'Owner'
  },
  {
    email: 'testuser3@example.com', role: 'User'
  }]

  const notOwnedProjectMembersListResult = [{
    email: 'testuser1@example.com', role: 'Owner'
  },
  {
    email: 'testuser2@example.com', role: 'Owner'
  }]

  const listWorkspacesResult = [
    {
      workspace: {
        cloudPlatform: 'Azure', attributes: { description: '' }, bucketName: '',
        createdDate: '2022-09-06T12:38:49.626Z', googleProject: '', isLocked: false, lastModified: '2022-09-06T12:38:49.643Z',
        name: `${azureBillingProjectName}_ws`, namespace: azureBillingProjectName, workspaceId: 'fake-workspace-id',
        workspaceType: 'mc', workspaceVersion: 'v2'
      }, accessLevel: 'OWNER', public: false
    },
    {
      workspace: {
        cloudPlatform: 'Gcp', attributes: { description: '' }, billingAccount: 'billingAccounts/fake-id', bucketName: 'fake-bucket',
        createdDate: '2022-09-06T12:38:49.626Z', googleProject: `${ownedBillingProjectName}_project`, isLocked: false,
        googleProjectNumber: '938723513660', lastModified: '2022-09-06T12:38:49.643Z',
        name: `${ownedBillingProjectName}_ws`, namespace: ownedBillingProjectName, workspaceId: 'fake-workspace-id',
        workspaceType: 'rawls', workspaceVersion: 'v2'
      }, accessLevel: 'PROJECT_OWNER', public: false
    }
  ]

  return await testPage.evaluate((spendReturnResult, projectListResult, ownedProjectMembersListResult, notOwnedProjectMembersListResult,
    ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName, azureBillingProjectName, listWorkspacesResult) => {
    const ownedMembersUrl = new RegExp(`api/billing/v2/${ownedBillingProjectName}/members`, 'g')
    const notOwnedMembersUrl = new RegExp(`api/billing/v2/${notOwnedBillingProjectName}/members`, 'g')
    const erroredBillingProjectUrl = new RegExp(`api/billing/v2/${erroredBillingProjectName}$`, 'g')
    const azureMembersUrl = new RegExp(`api/billing/v2/${azureBillingProjectName}/members`, 'g')

    window.ajaxOverridesStore.set([
      {
        filter: { url: /api\/billing\/v2$/ },
        fn: window.ajaxOverrideUtils.makeSuccess(projectListResult)
      },
      {
        filter: { url: /api\/billing\/v2(.*)\/members$/ },
        fn: () => () => window.ajaxOverrideUtils.makeSuccess([])
      },
      {
        filter: { url: ownedMembersUrl },
        fn: window.ajaxOverrideUtils.makeSuccess(ownedProjectMembersListResult)
      },
      {
        filter: { url: notOwnedMembersUrl },
        fn: window.ajaxOverrideUtils.makeSuccess(notOwnedProjectMembersListResult)
      },
      {
        filter: { url: azureMembersUrl },
        fn: window.ajaxOverrideUtils.makeSuccess(ownedProjectMembersListResult)
      },
      {
        filter: { url: erroredBillingProjectUrl, method: 'DELETE' },
        fn: () => () => Promise.resolve(new Response({ status: 204 }))
      },
      {
        filter: { url: /api\/billing(.*)\/spendReport(.*)/ },
        fn: window.ajaxOverrideUtils.makeSuccess(spendReturnResult)
      },
      {
        filter: { url: /api\/workspaces?(.*)/ },
        fn: window.ajaxOverrideUtils.makeSuccess(listWorkspacesResult)
      }
    ])
  }, spendReturnResult, projectListResult, ownedProjectMembersListResult, notOwnedProjectMembersListResult,
  ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName, azureBillingProjectName, listWorkspacesResult)
}

const setUpBillingTest = async (page, testUrl, token) => {
  // Sign in. This portion of the test is not mocked.
  await signIntoTerra(page, { token, testUrl })

  // Interact with the Billing Page via mocked AJAX responses.
  const ownedBillingProjectName = 'OwnedBillingProject'
  const notOwnedBillingProjectName = 'NotOwnedBillingProject'
  const erroredBillingProjectName = 'ErroredBillingProject'
  const azureBillingProjectName = 'AzureBillingProject'
  await setAjaxMockValues(page, ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName, azureBillingProjectName, true, '1110')

  const billingPage = billingProjectsPage(page, testUrl)

  return { ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName, azureBillingProjectName, billingPage }
}

const testBillingSpendReportFn = withUserToken(async ({ page, testUrl, token }) => {
  const { ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName, azureBillingProjectName, billingPage } =
    await setUpBillingTest(page, testUrl, token)

  // Select spend report and verify cost for default date ranges
  await billingPage.visit()
  await billingPage.selectProject(ownedBillingProjectName)
  await billingPage.selectSpendReport()
  // Title and cost are in different elements, but check both in same text assert to verify that category is correctly associated to its cost.
  await billingPage.assertText('Total spend$1,110.00')
  await billingPage.assertText('Total compute$999.00')
  await billingPage.assertText('Total storage$22.00')
  await billingPage.assertText('Total spend includes $89.00 in other infrastructure or query costs related to the general operations of Terra.')
  // Check that chart loaded, and workspaces are sorted by cost.
  await billingPage.assertText('Spend By Workspace')
  // Verify all series values of the most expensive workspace.
  await billingPage.assertChartValue(1, 'Most Expensive Workspace', 'Compute', '$900.00')
  await billingPage.assertChartValue(1, 'Most Expensive Workspace', 'Storage', '$20.00')
  // Spot-check other 2 workspaces.
  await billingPage.assertChartValue(2, 'Second Most Expensive Workspace', 'Compute', '$90.00')
  await billingPage.assertChartValue(3, 'Third Most Expensive Workspace', 'Storage', '$0.00')
  // Verify the spend report configuration option is present
  await billingPage.assertText('View billing account')
  // Verify link to Azure portal is not present
  await billingPage.assertTextNotFound('View project resources in Azure Portal')

  // Change the returned mock cost to mimic different date ranges.
  await setAjaxMockValues(page, ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName,
    azureBillingProjectName, true, '1110.17', 20)
  await billingPage.setSpendReportDays(90)
  await billingPage.assertText('Total spend$1,110.17')
  // Check that title updated to reflect truncation.
  await billingPage.assertText('Top 10 Spending Workspaces')
  await billingPage.assertChartValue(10, 'Extra Inexpensive Workspace', 'Compute', '$0.01')

  // Check accessibility of spend report page.
  await verifyAccessibility(page)

  // Select a billing project that is not owned by the user
  await billingPage.visit()
  await billingPage.selectProject(notOwnedBillingProjectName)

  // Check that the Spend report tab is not visible on this page
  await billingPage.assertTextNotFound('Spend report')

  // Select an Azure billing project and check that the Spend Report tab is accessible but displaying only total cost information
  await billingPage.visit()
  await billingPage.selectProject(azureBillingProjectName, AZURE)
  await billingPage.selectSpendReport()

  // Title and cost are in different elements, but check both in same text assert to verify that category is correctly associated to its cost.
  await billingPage.assertText('Total spend$1,110.17')
  await billingPage.assertText('Total compute$999.00')
  await billingPage.assertText('Total storage$22.00')
  await billingPage.assertText('Total spend includes $89.00 in other infrastructure or query costs related to the general operations of Terra. See our documentation to learn more about Azure costs.')
  // Verify that per-workspace costs are not included
  await billingPage.assertTextNotFound('Spend By Workspace')
  await billingPage.assertTextNotFound('Top 10 Spending Workspaces')
  // Verify spend report configuration is not visible
  await billingPage.assertTextNotFound('View billing account')
  // Verify link to Azure portal is present
  await billingPage.assertText('View project resources in Azure Portal')

  // Check accessibility of the Azure spend report
  await verifyAccessibility(page)
})

registerTest({
  name: 'billing-spend-report',
  fn: testBillingSpendReportFn
})

const testBillingWorkspacesFn = withUserToken(async ({ page, testUrl, token }) => {
  const { ownedBillingProjectName, notOwnedBillingProjectName, azureBillingProjectName, billingPage } = await setUpBillingTest(page, testUrl, token)
  const useBillingProjectText = 'Use this Terra billing project to createWorkspaces'

  const verifyWorkspaceControls = async () => {
    await billingPage.assertText('Workspaces')
    await billingPage.assertText('Name')
    await billingPage.assertText('Created By')
    await billingPage.assertText('Last Modified')
    await billingPage.assertTextNotFound(useBillingProjectText)
  }

  // Select a billing project that is owned by the user
  await billingPage.visit()
  await billingPage.selectProject(ownedBillingProjectName)

  // Check that the Workspaces tab is visible on this page
  await verifyWorkspaceControls()
  await billingPage.showWorkspaceDetails(`${ownedBillingProjectName}_ws`)
  await billingPage.assertText(`Google Project${ownedBillingProjectName}_project`)

  // Check accessibility of workspaces view (GCP).
  await verifyAccessibility(page, 1) // Need to fix "Ensures elements with an ARIA role that require child roles contain them", WOR-846

  // Select a billing project that is not owned by the user and verify message that shows when there are no workspaces
  await billingPage.visit()
  await billingPage.selectProject(notOwnedBillingProjectName)
  await billingPage.assertText(useBillingProjectText)
  // Check accessibility for color contrast of the message.
  await verifyAccessibility(page)

  // Select Azure billing project and verify workspace tab details
  await billingPage.visit()
  await billingPage.selectProject(azureBillingProjectName, AZURE)
  await verifyWorkspaceControls()
  await billingPage.showWorkspaceDetails(`${azureBillingProjectName}_ws`)
  await billingPage.assertText(`Resource Group ID${azureBillingProjectName}_mrg`)

  // Check accessibility of the Azure workspace details
  await verifyAccessibility(page, 1) // Need to fix "Ensures elements with an ARIA role that require child roles contain them", WOR-846
})

registerTest({
  name: 'billing-workspaces',
  fn: testBillingWorkspacesFn
})

const testBillingMembersFn = withUserToken(async ({ page, testUrl, token }) => {
  const { ownedBillingProjectName, notOwnedBillingProjectName, billingPage } = await setUpBillingTest(page, testUrl, token)

  // Select a billing project that is owned by the user
  await billingPage.visit()
  await billingPage.selectProject(ownedBillingProjectName)
  await billingPage.selectMembers()

  // The test user has the Owner role, so the billing project members tab should be titled "Members"
  await billingPage.assertText('Members')

  // The Owner role should see the Add User button
  await billingPage.assertText('Add User')

  // The test user has the Owner role, so they should see all members
  await billingPage.assertText('testuser1@example.com')
  await billingPage.assertText('testuser3@example.com')

  // Check accessibility of users view (as owner).
  await verifyAccessibility(page)

  // Select a billing project that is not owned by the user
  await billingPage.visit()
  await billingPage.selectProject(notOwnedBillingProjectName)
  await billingPage.selectOwners()

  // The test user has the User role, so the billing project members tab should be titled "Owners"
  await billingPage.assertText('Owners')

  // The User role should not see the Add User button
  await billingPage.assertTextNotFound('Add User')

  // The test user has the User role, so they should see members with the Owner role, but not with the User role
  await billingPage.assertText('testuser1@example.com')
  await billingPage.assertTextNotFound('testuser3@example.com')

  // Check accessibility of users view (as non-owner).
  await verifyAccessibility(page)
})

registerTest({
  name: 'billing-members',
  fn: testBillingMembersFn
})

const testDeleteBillingProjectFn = withUserToken(async ({ page, testUrl, token }) => {
  const { ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName, azureBillingProjectName, billingPage } =
    await setUpBillingTest(page, testUrl, token)

  await billingPage.visit()

  // Assert that the errored billing project is visible.
  // The choice to use an errored billing project is historical in that previously
  // only billing projects in an errored state could be deleted.
  await billingPage.assertText(erroredBillingProjectName)

  // Click the Delete Billing Project button
  await billingPage.selectDeleteProjectMenuOption(erroredBillingProjectName)

  // Assert that the confirmation modal is visible
  await billingPage.assertText('Are you sure you want to delete the billing project')

  // Reset the ajax values to NOT include the errored billing project before confirming the deletion
  // This is so we can test that the project list refreshes properly
  await setAjaxMockValues(page, ownedBillingProjectName, notOwnedBillingProjectName, erroredBillingProjectName, azureBillingProjectName,
    false, '1110.17', 20)

  // Confirm delete
  await billingPage.confirmDeleteBillingProject()

  // Assert that the errored billing project is no longer visible
  await billingPage.assertTextNotFound(erroredBillingProjectName)
})

registerTest({
  name: 'billing-project-delete',
  fn: testDeleteBillingProjectFn
})

const testBillingProjectOneOwnerWarning = withUserToken(async ({ page, testUrl, token }) => {
  await signIntoTerra(page, { token, testUrl })

  const ownedAndNoOtherUsersBillingProject = 'OwnedAndNoOtherUsers'
  const ownedAndSharedBillingProject = 'OwnedAndShared'
  const ownedWithMultipleOwnersBillingProject = 'OwnedWithMultipleOwners'
  const usedWithOneOwnerBillingProject = 'UsedWithOneOwner'
  const usedWithMultipleOwnersBillingProject = 'UsedWithMultipleOwners'

  await page.evaluate(({
    userEmail,
    ownedAndNoOtherUsersBillingProject, ownedAndSharedBillingProject, ownedWithMultipleOwnersBillingProject,
    usedWithOneOwnerBillingProject, usedWithMultipleOwnersBillingProject
  }) => {
    window.ajaxOverridesStore.set([
      {
        filter: { url: /api\/billing\/v2$/ },
        fn: window.ajaxOverrideUtils.makeSuccess([
          {
            projectName: ownedAndNoOtherUsersBillingProject,
            billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['Owner'], status: 'Ready', cloudPlatform: 'GCP'
          },
          {
            projectName: ownedAndSharedBillingProject,
            billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['Owner'], status: 'Ready', cloudPlatform: 'GCP'
          },
          {
            projectName: ownedWithMultipleOwnersBillingProject,
            billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['Owner'], status: 'Ready', cloudPlatform: 'GCP'
          },
          {
            projectName: usedWithOneOwnerBillingProject,
            billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['User'], status: 'Ready', cloudPlatform: 'GCP'
          },
          {
            projectName: usedWithMultipleOwnersBillingProject,
            billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['User'], status: 'Ready', cloudPlatform: 'GCP'
          }
        ])
      },
      {
        filter: { url: new RegExp(`api/billing/v2/${ownedAndNoOtherUsersBillingProject}/members`) },
        fn: window.ajaxOverrideUtils.makeSuccess([
          { email: userEmail, role: 'Owner' },
          { email: 'testuser1@example.com', role: 'User' }
        ])
      },
      {
        filter: { url: new RegExp(`api/billing/v2/${ownedAndSharedBillingProject}/members`) },
        fn: window.ajaxOverrideUtils.makeSuccess([
          { email: userEmail, role: 'Owner' }
        ])
      },
      {
        filter: { url: new RegExp(`api/billing/v2/${ownedWithMultipleOwnersBillingProject}/members`) },
        fn: window.ajaxOverrideUtils.makeSuccess([
          { email: userEmail, role: 'Owner' },
          { email: 'testuser1@example.com', role: 'Owner' }
        ])
      },
      {
        filter: { url: new RegExp(`api/billing/v2/${usedWithOneOwnerBillingProject}/members`) },
        fn: window.ajaxOverrideUtils.makeSuccess([
          { email: userEmail, role: 'User' },
          { email: 'testuser1@example.com', role: 'Owner' }
        ])
      },
      {
        filter: { url: new RegExp(`api/billing/v2/${usedWithMultipleOwnersBillingProject}/members`) },
        fn: window.ajaxOverrideUtils.makeSuccess([
          { email: userEmail, role: 'User' },
          { email: 'testuser1@example.com', role: 'Owner' },
          { email: 'testuser2@example.com', role: 'Owner' }
        ])
      }
    ])
  }, {
    userEmail,
    ownedAndNoOtherUsersBillingProject, ownedAndSharedBillingProject, ownedWithMultipleOwnersBillingProject,
    usedWithOneOwnerBillingProject, usedWithMultipleOwnersBillingProject
  })

  const billingPage = billingProjectsPage(page, testUrl)
  await billingPage.visit()

  const ownerWarningText = 'You are the only owner of this shared billing project. Consider adding another owner to ensure someone is able to manage the billing project in case you lose access to your account.'

  await billingPage.selectProject(ownedAndNoOtherUsersBillingProject)
  await billingPage.assertText(ownerWarningText)

  await billingPage.selectProject(ownedAndSharedBillingProject)
  await billingPage.assertTextNotFound(ownerWarningText)

  await billingPage.selectProject(ownedWithMultipleOwnersBillingProject)
  await billingPage.assertTextNotFound(ownerWarningText)

  const userWarningText = 'This shared billing project has only one owner. Consider requesting testuser1@example.com to add another owner to ensure someone is able to manage the billing project in case they lose access to their account.'

  await billingPage.selectProject(usedWithOneOwnerBillingProject)
  await billingPage.assertText(userWarningText)

  await billingPage.selectProject(usedWithMultipleOwnersBillingProject)
  await billingPage.assertTextNotFound(userWarningText)
})

registerTest({
  name: 'billing-project-one-owner-warning',
  fn: testBillingProjectOneOwnerWarning
})
