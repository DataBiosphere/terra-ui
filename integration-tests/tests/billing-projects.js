const _ = require('lodash/fp')
const { assertTextNotFound, click, clickable, dismissNotifications, findText, noSpinnersAfter, select, signIntoTerra } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const billingProjectsPage = (testPage, testUrl) => {
  return {
    visit: async () => await testPage.goto(`${testUrl}/#billing`),

    selectSpendReport: async () => {
      await click(testPage, clickable({ text: 'Spend report' }))
    },

    selectProject: async billingProjectName => {
      await noSpinnersAfter(
        testPage,
        { action: () => click(testPage, clickable({ text: billingProjectName })) }
      )
    },

    setSpendReportDays: async days => await select(testPage, 'Date range', `Last ${days} days`),

    assertText: async expectedText => await findText(testPage, expectedText),

    assertChartValue: async (number, workspaceName, category, cost) => {
      // This checks the accessible text for chart values.
      await testPage.waitForXPath(`(//*[@role="img"])[contains(@aria-label,"${number}. Workspace ${workspaceName}, ${category}: ${cost}.")]`)
    }
  }
}

const setAjaxMockValues = async (testPage, ownedBillingProjectName, notOwnedBillingProjectName, spendCost, numExtraWorkspaces = 0) => {
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

  const projectListResult = [{
    projectName: ownedBillingProjectName,
    billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['Owner'], status: 'Ready'
  },
  {
    projectName: notOwnedBillingProjectName,
    billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['User'], status: 'Ready'
  }]
  return await testPage.evaluate((spendReturnResult, projectListResult) => {
    window.ajaxOverridesStore.set([
      {
        filter: { url: /api\/billing\/v2$/ },
        fn: () => () => Promise.resolve(new Response(JSON.stringify(projectListResult), { status: 200 }))
      },
      {
        filter: { url: /Alpha_Spend_Report_Users\/action\/use/ },
        fn: () => () => Promise.resolve(new Response(JSON.stringify(true), { status: 200 }))
      },
      {
        filter: { url: /api\/billing\/v2(.*)\/members$/ },
        fn: () => () => Promise.resolve(new Response('[]', { status: 200 }))
      },
      {
        filter: { url: /api\/billing(.*)\/spendReport(.*)/ },
        fn: () => () => Promise.resolve(new Response(JSON.stringify(spendReturnResult), { status: 200 }))
      }
    ])
  }, spendReturnResult, projectListResult)
}

const testBillingSpendReportFn = withUserToken(async ({ page, testUrl, token }) => {
  // Sign in. This portion of the test is not mocked.
  await page.goto(testUrl)
  await signIntoTerra(page, token)
  await dismissNotifications(page)

  // Interact with the Billing Page via mocked AJAX responses.
  const ownedBillingProjectName = 'OwnedBillingProject'
  const notOwnedBillingProjectName = 'NotOwnedBillingProject'
  await setAjaxMockValues(page, ownedBillingProjectName, notOwnedBillingProjectName, '1110')

  // Select spend report and verify cost for default date ranges
  const billingPage = billingProjectsPage(page, testUrl)
  await billingPage.visit()
  await billingPage.selectProject(ownedBillingProjectName)
  await billingPage.selectSpendReport()
  // Title and cost are in different elements, but check both in same text assert to verify that category is correctly associated to its cost.
  await billingPage.assertText('Total spend$1,110.00')
  await billingPage.assertText('Total compute$999.00')
  await billingPage.assertText('Total storage$22.00')
  await billingPage.assertText('Total other$89.00')
  // Check that chart loaded, and workspaces are sorted by cost.
  await billingPage.assertText('Spend By Workspace')
  // Verify all series values of the most expensive workspace.
  await billingPage.assertChartValue(1, 'Most Expensive Workspace', 'Compute', '$900.00')
  await billingPage.assertChartValue(1, 'Most Expensive Workspace', 'Other', '$80.00')
  await billingPage.assertChartValue(1, 'Most Expensive Workspace', 'Storage', '$20.00')
  // Spot-check other 2 workspaces.
  await billingPage.assertChartValue(2, 'Second Most Expensive Workspace', 'Compute', '$90.00')
  await billingPage.assertChartValue(3, 'Third Most Expensive Workspace', 'Storage', '$0.00')

  // Change the returned mock cost to mimic different date ranges.
  await setAjaxMockValues(page, ownedBillingProjectName, notOwnedBillingProjectName, '1110.17', 20)
  await billingPage.setSpendReportDays(90)
  await billingPage.assertText('Total spend$1,110.17')
  // Check that title updated to reflect truncation.
  await billingPage.assertText('Top 10 Spending Workspaces')
  await billingPage.assertChartValue(10, 'Extra Inexpensive Workspace', 'Compute', '$0.01')

  // Select a billing project that is not owned by the user
  await billingPage.visit()
  await billingPage.selectProject(notOwnedBillingProjectName)

  //Check that the Spend report tab is not visible on this page
  await assertTextNotFound(billingPage, 'Spend report')
})

const testBillingSpendReport = {
  name: 'billing-spend-report',
  fn: testBillingSpendReportFn
}

module.exports = { testBillingSpendReport }
