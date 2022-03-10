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

    assertText: async expectedText => await findText(testPage, expectedText)
  }
}

const setAjaxMockValues = async (testPage, ownedBillingProjectName, spendCost) => {
  const spendReturnResult = {
    spendSummary: {
      cost: spendCost, credits: '2.50', currency: 'USD', endTime: '2022-03-04T00:00:00.000Z', startTime: '2022-02-02T00:00:00.000Z'
    }
  }
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

  // Change the returned mock cost to mimic different date ranges
  await setAjaxMockValues(page, billingProjectName, '135')
  await billingPage.setSpendReportDays(90)
  await billingPage.assertText('$135.00')
})

const testBillingSpendReport = {
  name: 'billing-spend-report',
  fn: testBillingSpendReportFn
}

module.exports = { testBillingSpendReport }
