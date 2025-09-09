// This test is owned by the Workspaces Team.
const _ = require('lodash/fp');
const {
  assertTextNotFound,
  click,
  clickable,
  findText,
  gotoPage,
  select,
  signIntoTerra,
  waitForNoSpinners,
  verifyAccessibility,
} = require('../utils/integration-utils');
const { registerTest } = require('../utils/jest-utils');
const { withUserToken } = require('../utils/terra-sa-utils');

const billingProjectsPage = (testPage, testUrl) => {
  return {
    visit: async () => {
      // Note: not using noSpinnersAfter because this action changes the page, and
      // noSpinners after checks that a spinner appears and disappear within the same page.
      await gotoPage(testPage, `${testUrl}/#billing`);
      await findText(testPage, 'Select a Billing Project');
      await waitForNoSpinners(testPage);
    },

    selectSpendReport: async () => {
      await click(testPage, clickable({ text: 'Spend report' }));
    },

    selectProject: (billingProjectName) => {
      return click(testPage, clickable({ textContains: billingProjectName }));
    },

    setSpendReportDays: async (days) => await select(testPage, 'Date range', `Last ${days} days`),

    assertText: async (expectedText) => await findText(testPage, expectedText),

    assertTextNotFound: async (unexpectedText) => await assertTextNotFound(testPage, unexpectedText),

    assertChartValue: async (label, category, cost) => {
      // This checks the accessible text for chart values.
      await testPage.waitForSelector(`[role="img"][aria-label*="${label}, ${category}: ${cost}."]`);
    },
  };
};

const setAjaxMockValues = async (testPage, ownedBillingProjectName, azureBillingProjectName, spendCost, numExtraWorkspaces = 0) => {
  const spendReturnResult = {
    spendSummary: {
      cost: spendCost,
      credits: '-2.50',
      currency: 'USD',
      endTime: '2022-03-04T00:00:00.000Z',
      startTime: '2022-02-02T00:00:00.000Z',
    },
    spendDetails: [
      {
        aggregationKey: 'Daily',
        spendData: [
          {
            cost: '100',
            credits: '0.00',
            currency: 'USD',
            endTime: '2022-02-02T00:00:00.000Z',
            startTime: '2022-02-05T16:00:00.000Z',
            subAggregation: {
              aggregationKey: 'Category',
              spendData: [
                { cost: '90', category: 'Compute', credits: '0.00', currency: 'USD' },
                { cost: '2', category: 'Storage', credits: '0.00', currency: 'USD' },
                { cost: '8', category: 'Other', credits: '0.00', currency: 'USD' },
              ],
            },
          },
          {
            cost: '1000',
            credits: '0.00',
            currency: 'USD',
            endTime: '2022-02-02T00:00:00.000Z',
            startTime: '2022-02-06T16:00:00.000Z',
            subAggregation: {
              aggregationKey: 'Category',
              spendData: [
                { cost: '900', category: 'Compute', credits: '0.00', currency: 'USD' },
                { cost: '20', category: 'Storage', credits: '0.00', currency: 'USD' },
                { cost: '80', category: 'Other', credits: '0.00', currency: 'USD' },
              ],
            },
          },
          {
            cost: '10',
            credits: '0.00',
            currency: 'USD',
            endTime: '2022-02-02T00:00:00.000Z',
            startTime: '2022-02-07T16:00:00.000Z',
            subAggregation: {
              aggregationKey: 'Category',
              spendData: [
                { cost: '9', category: 'Compute', credits: '0.00', currency: 'USD' },
                { cost: '0', category: 'Storage', credits: '0.00', currency: 'USD' },
                { cost: '1', category: 'Other', credits: '0.00', currency: 'USD' },
              ],
            },
          },
        ],
      },
      {
        aggregationKey: 'Category',
        spendData: [
          { cost: '999', category: 'Compute', credits: '0.00', currency: 'USD' },
          { cost: '22', category: 'Storage', credits: '0.00', currency: 'USD' },
          { cost: '11', category: 'WorkspaceInfrastructure', credits: '0.00', currency: 'USD' },
          { cost: '89', category: 'Other', credits: '0.00', currency: 'USD' },
        ],
      },
    ],
  };

  _.forEach(() => {
    spendReturnResult.spendDetails[0].spendData.push({
      cost: '0.01',
      workspace: { name: 'Extra Inexpensive Workspace' },
      subAggregation: {
        aggregationKey: 'Category',
        spendData: [
          { cost: '0.01', category: 'Compute' },
          { cost: '0.00', category: 'Storage' },
          { cost: '0.00', category: 'Other' },
        ],
      },
    });
  }, _.range(0, numExtraWorkspaces));

  const projectListResult = _.compact([
    {
      projectName: ownedBillingProjectName,
      billingAccount: 'billingAccounts/fake-id',
      invalidBillingAccount: false,
      roles: ['Owner'],
      status: 'Ready',
      cloudPlatform: 'GCP',
    },
    {
      projectName: azureBillingProjectName,
      managedAppCoordinates: { managedResourceGroupId: `${azureBillingProjectName}_mrg`, subscriptionId: 'subId', tenantId: 'tenantId' },
      invalidBillingAccount: false,
      roles: ['Owner'],
      status: 'Ready',
      cloudPlatform: 'AZURE',
      landingZoneId: 'fakeLandingZoneId',
    },
  ]);

  const ownedProjectMembersListResult = [
    {
      email: 'testuser1@example.com',
      role: 'Owner',
    },
    {
      email: 'testuser2@example.com',
      role: 'Owner',
    },
    {
      email: 'testuser3@example.com',
      role: 'User',
    },
  ];

  const listWorkspacesResult = [
    {
      workspace: {
        cloudPlatform: 'Azure',
        attributes: { description: '' },
        bucketName: '',
        createdDate: '2022-09-06T12:38:49.626Z',
        googleProject: '',
        isLocked: false,
        lastModified: '2022-09-06T12:38:49.643Z',
        name: `${azureBillingProjectName}_ws`,
        namespace: azureBillingProjectName,
        workspaceId: 'fake-workspace-id',
        workspaceType: 'mc',
        workspaceVersion: 'v2',
      },
      accessLevel: 'OWNER',
      public: false,
    },
    {
      workspace: {
        cloudPlatform: 'Gcp',
        attributes: { description: '' },
        billingAccount: 'billingAccounts/fake-id',
        bucketName: 'fake-bucket',
        createdDate: '2022-09-06T12:38:49.626Z',
        googleProject: `${ownedBillingProjectName}_project`,
        isLocked: false,
        googleProjectNumber: '938723513660',
        lastModified: '2022-09-06T12:38:49.643Z',
        name: `${ownedBillingProjectName}_ws`,
        namespace: ownedBillingProjectName,
        workspaceId: 'fake-workspace-id',
        workspaceType: 'rawls',
        workspaceVersion: 'v2',
      },
      accessLevel: 'PROJECT_OWNER',
      public: false,
    },
  ];

  return await testPage.evaluate(
    (spendReturnResult, projectListResult, ownedProjectMembersListResult, ownedBillingProjectName, azureBillingProjectName, listWorkspacesResult) => {
      const ownedMembersUrl = new RegExp(`api/billing/v2/${ownedBillingProjectName}/members`, 'g');
      const azureMembersUrl = new RegExp(`api/billing/v2/${azureBillingProjectName}/members`, 'g');

      window.ajaxOverridesStore.set([
        {
          filter: { url: /api\/billing\/v2$/ },
          fn: window.ajaxOverrideUtils.makeSuccess(projectListResult),
        },
        {
          filter: { url: /api\/billing\/v2(.*)\/members$/ },
          fn: () => () => window.ajaxOverrideUtils.makeSuccess([]),
        },
        {
          filter: { url: ownedMembersUrl },
          fn: window.ajaxOverrideUtils.makeSuccess(ownedProjectMembersListResult),
        },
        {
          filter: { url: azureMembersUrl },
          fn: window.ajaxOverrideUtils.makeSuccess(ownedProjectMembersListResult),
        },
        {
          filter: { url: /api\/billing(.*)\/spendReport(.*)/ },
          fn: window.ajaxOverrideUtils.makeSuccess(spendReturnResult),
        },
        {
          filter: { url: /api\/workspaces?(.*)/ },
          fn: window.ajaxOverrideUtils.makeSuccess(listWorkspacesResult),
        },
      ]);
    },
    spendReturnResult,
    projectListResult,
    ownedProjectMembersListResult,
    ownedBillingProjectName,
    azureBillingProjectName,
    listWorkspacesResult
  );
};

const setUpBillingTest = async (page, testUrl, token) => {
  // Sign in. This portion of the test is not mocked.
  await signIntoTerra(page, { token, testUrl });

  // Interact with the Billing Page via mocked AJAX responses.
  const ownedBillingProjectName = 'OwnedBillingProject';
  const azureBillingProjectName = 'AzureBillingProject';
  await setAjaxMockValues(page, ownedBillingProjectName, azureBillingProjectName, '1110');

  const billingPage = billingProjectsPage(page, testUrl);

  return { ownedBillingProjectName, azureBillingProjectName, billingPage };
};

const testBillingSpendReportFn = withUserToken(async ({ page, testUrl, token }) => {
  const { ownedBillingProjectName, azureBillingProjectName, billingPage } = await setUpBillingTest(page, testUrl, token);

  // Select spend report and verify cost for default date ranges
  await billingPage.visit();
  await billingPage.selectProject(ownedBillingProjectName);
  await billingPage.selectSpendReport();
  // Title and cost are in different elements, but check both in same text assert to verify that category is correctly associated to its cost.
  await billingPage.assertText('Total spend$1,107.67');
  await billingPage.assertText('Total compute$999.00');
  await billingPage.assertText('Total storage$22.00');
  await billingPage.assertText('Total spend includes $89.00 in other infrastructure or query costs related to the general operations of Terra.');
  // Check that chart loaded, and costs are sorted by date.
  await billingPage.assertText('Daily Spend');
  // Verify all series values of all the dates.
  await billingPage.assertChartValue('Feb 5', 'Compute', '$90.00');
  await billingPage.assertChartValue('Feb 6', 'Compute', '$900.00');
  await billingPage.assertChartValue('Feb 6', 'Storage', '$20.00');
  await billingPage.assertChartValue('Feb 7', 'Storage', '$0.00');
  // Verify the spend report configuration option is present
  await billingPage.assertText('View billing account');
  // Verify link to Azure portal is not present
  await billingPage.assertTextNotFound('View project resources in Azure Portal');

  // Change the returned mock cost to mimic different date ranges.
  await setAjaxMockValues(page, ownedBillingProjectName, azureBillingProjectName, '1110.17', 20);
  await billingPage.setSpendReportDays(90);
  await billingPage.assertText('Total spend$1,107.67');
  // Check that title updated to reflect truncation.
  await billingPage.assertText('Daily Spend');
  await billingPage.assertChartValue('Feb 6', 'Compute', '$900.00');

  // Check accessibility of spend report page.
  await verifyAccessibility(page);

  // Select an Azure billing project and check that the Spend Report tab is accessible but displaying only total cost information
  await billingPage.visit();
  await billingPage.selectProject(azureBillingProjectName);
  await billingPage.selectSpendReport();

  // Title and cost are in different elements, but check both in same text assert to verify that category is correctly associated to its cost.
  await billingPage.assertText('Total spend$1,107.67');
  await billingPage.assertText('Total analysis compute$999.00');
  await billingPage.assertText('Total workspace storage$22.00');
  await billingPage.assertText('Total workspace infrastructure$11.00');
  await billingPage.assertText(
    'Total spend includes $89.00 in other infrastructure or query costs related to the general operations of Terra. See our documentation to learn more about Azure costs.'
  );
  // Verify that per-day costs are not included
  await billingPage.assertTextNotFound('Daily Spend');
  // Verify spend report configuration is not visible
  await billingPage.assertTextNotFound('View billing account');
  // Verify link to Azure portal is present
  await billingPage.assertText('View project resources in Azure Portal');

  // Check accessibility of the Azure spend report
  await verifyAccessibility(page);
});

registerTest({
  name: 'billing-spend-report',
  fn: testBillingSpendReportFn,
});
