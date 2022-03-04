const _ = require('lodash/fp')
const { click, clickable, dismissNotifications, findText, noSpinnersAfter, select, signIntoTerra } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


class BillingProjectsPage {
  constructor(testPage, testUrl) {
    this.testPage = testPage
    this.testUrl = testUrl
    this.mockValues = {}
  }

  async setAjaxMock(mockValues) {
    this.mockValues = _.assign(this.mockValues, mockValues)
    const spendReturnResult = {
      spendSummary: {
        cost: this.mockValues.spendCost, credits: '2.50', currency: 'USD', endTime: '2022-03-04T00:00:00.000Z', startTime: '2022-02-02T00:00:00.000Z'
      }
    }
    const projectListResult = [{
      projectName: this.mockValues.ownedBillingProjectName,
      billingAccount: 'billingAccounts/fake-id', invalidBillingAccount: false, roles: ['Owner'], status: 'Ready'
    }]
    const setAjaxMock = async () => {
      await this.testPage.evaluate((spendReturnResult, projectListResult) => {
        window.ajaxOverridesStore.set([
          {
            filter: { url: /api\/billing\/v2$/ },
            fn: () => async () => { return new Response(JSON.stringify(projectListResult), { status: 200 }) }
          },
          {
            filter: { url: /Alpha_Spend_Report_Users\/action\/use/ },
            fn: () => async () => { return new Response(JSON.stringify(true), { status: 200 }) }
          },
          {
            filter: { url: /api\/billing\/v2(.*)\/members$/ },
            fn: () => async () => { return new Response('[]', { status: 200 }) }
          },
          {
            filter: { url: /api\/billing(.*)\/spendReport(.*)/ },
            fn: () => async () => { return new Response(JSON.stringify(spendReturnResult), { status: 200 }) }
          }
        ])
      }, spendReturnResult, projectListResult)
    }
    await setAjaxMock()
  }

  async visit() {
    await this.testPage.goto(`${this.testUrl}/#billing`)
  }

  async selectSpendReport() {
    await noSpinnersAfter(
      this.testPage,
      { action: () => click(this.testPage, clickable({ text: this.mockValues.ownedBillingProjectName })) }
    )
    await click(this.testPage, clickable({ text: 'Spend report' }))
  }

  async setSpendReportDays(days) {
    await select(this.testPage, 'Date range', `Last ${days} days`)
  }

  async assertText(expectedText) {
    await findText(this.testPage, expectedText)
  }
}

const testBillingSpendReportFn = withUserToken(async ({ page, testUrl, token }) => {
  // Sign in. This portion of the test is not mocked.
  await page.goto(testUrl)
  await signIntoTerra(page, token)
  await dismissNotifications(page)

  // Interact with the Billing Page via mocked AJAX responses.
  const billingPage = new BillingProjectsPage(page, testUrl)
  await billingPage.setAjaxMock({ ownedBillingProjectName: 'OwnedBillingProject', spendCost: '90.13' })
  await billingPage.visit()
  await billingPage.selectSpendReport()
  await billingPage.assertText('$90.13')
  await billingPage.setAjaxMock({ spendCost: '135' })
  await billingPage.setSpendReportDays(90)
  await billingPage.assertText('$135.00')
})

const testBillingSpendReport = {
  name: 'billing-spend-report',
  fn: testBillingSpendReportFn
}

module.exports = { testBillingSpendReport }
