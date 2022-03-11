const { click, clickable, dismissNotifications, findText, noSpinnersAfter, select, signIntoTerra } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const billingProjectsPage = (testPage, testUrl) => {
  return {
    visit: async () => await testPage.goto(`${testUrl}/#billing`),

    selectSpendReport: async billingProjectName => {
      await noSpinnersAfter(
        testPage,
        { action: () => click(testPage, clickable({ text: billingProjectName })) }
      )
      await click(testPage, clickable({ text: 'Spend report' }))
    },

    setSpendReportDays: async days => await select(testPage, 'Date range', `Last ${days} days`),

    assertText: async expectedText => await findText(testPage, expectedText),

    assertChartValue: async (expectedNumber, expectedText) => {
      // This checks the accessible text for chart values.
      await testPage.waitForXPath(`(//*[@role="img"])[contains(@aria-label,"${expectedNumber}. ${expectedText}")]`)
    }
  }
}

const setAjaxMockValues = async (testPage, ownedBillingProjectName, spendCost, numExtraWorkspaces = 0) => {
  const spendReturnResult = {
    spendSummary: {
      cost: spendCost, credits: '2.50', currency: 'USD', endTime: '2022-03-04T00:00:00.000Z', startTime: '2022-02-02T00:00:00.000Z'
    },
    spendDetails: [{
      aggregationKey: 'Workspace',
      spendData: [
        { cost: '100', workspace: { name: 'Second Most Expensive Workspace' } },
        { cost: '1000', workspace: { name: 'Most Expensive Workspace' } },
        { cost: '10', workspace: { name: 'Third Most Expensive Workspace' } }
      ]
    }]
  }

  _.forEach(() => {
    spendReturnResult.spendDetails[0].spendData.push({ cost: '0.01', workspace: { name: 'Extra Inexpensive Workspace' } })
  }, _.range(0, numExtraWorkspaces))

  const projectListResult = [{
    projectName: ownedBillingProjectName,
    billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['Owner'], status: 'Ready'
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
  const billingProjectName = 'OwnedBillingProject'
  await setAjaxMockValues(page, billingProjectName, '90.13')

  // Select spend report and verify cost for default date ranges
  const billingPage = billingProjectsPage(page, testUrl)
  await billingPage.visit()
  await billingPage.selectSpendReport(billingProjectName)
  await billingPage.assertText('$90.13')
  // Check that chart loaded, and workspaces are sorted by cost.
  await billingPage.assertText('Spend By Workspace')
  await billingPage.assertChartValue(1, 'Most Expensive Workspace, $1,000')
  await billingPage.assertChartValue(2, 'Second Most Expensive Workspace, $100')
  await billingPage.assertChartValue(3, 'Third Most Expensive Workspace, $10')

  // Change the returned mock cost to mimic different date ranges.
  await setAjaxMockValues(page, billingProjectName, '135', 20)
  await billingPage.setSpendReportDays(90)
  await billingPage.assertText('$135.00')
  // Check that title updated to reflect truncation.
  await billingPage.assertText('Top 10 Spending Workspaces')
  await billingPage.assertChartValue(10, 'Extra Inexpensive Workspace')
})

const testBillingSpendReport = {
  name: 'billing-spend-report',
  fn: testBillingSpendReportFn
}

module.exports = { testBillingSpendReport }
