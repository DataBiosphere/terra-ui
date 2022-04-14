// This test is owned by the Batch Workflows Team.
const _ = require('lodash/fp')
const firecloud = require('integration-tests/utils/firecloud-utils')
const { withWorkspace } = require('integration-tests/utils/integration-helpers')
const { click, clickable, dismissNotifications, findElement, findText, signIntoTerra } = require('integration-tests/utils/integration-utils')
const { withUserToken } = require('integration-tests/utils/terra-sa-utils')


const testFindWorkflowFn = _.flow(
  withWorkspace,
  withUserToken
)(async ({ billingProject, page, testUrl, token, workflowName, workspaceName }) => {
  await page.goto(testUrl)
  await signIntoTerra(page, token)
  await dismissNotifications(page)
  await click(page, clickable({ textContains: 'View Examples' }))
  await click(page, clickable({ textContains: 'code & workflows' }))
  await click(page, clickable({ textContains: workflowName }))

  await firecloud.signIntoFirecloud(page, token)
  await findText(page, workflowName)
  await findText(page, 'Synopsis') // wait for spinner overlay
  await click(page, clickable({ textContains: 'Export to Workspace...' }))
  await click(page, clickable({ textContains: `${workflowName}-configured` }))
  await click(page, clickable({ textContains: 'Use Selected Configuration' }))
  await findText(page, 'Select a workspace')
  await firecloud.selectWorkspace(page, billingProject, workspaceName)
  await click(page, clickable({ text: 'Export to Workspace' }))

  const backToTerra = async () => {
    /* This else/if is necessary to "hack" going back to localhost:3000-Terra after going to Firecloud,
     without these lines it will redirect to dev-Terra even if started out at localhost:3000-Terra */
    if (testUrl === 'http://localhost:3000') {
      await findElement(page, clickable({ textContains: 'Yes' }))
      const yesButtonHrefDetails = (await page.$x('//a[contains(text(), "Yes")]/@href'))[0]
      const redirectURL = (await page.evaluate(yesButton => yesButton.textContent, yesButtonHrefDetails)).replace(
        'https://bvdp-saturn-dev.appspot.com',
        testUrl)
      await page.goto(redirectURL)
    } else {
      await click(page, clickable({ textContains: 'Yes' }))
    }
  }

  await Promise.all([
    page.waitForNavigation(),
    backToTerra()
  ])

  await signIntoTerra(page, token)
  await findText(page, `${workflowName}-configured`)
  await findText(page, 'inputs')
})

const testFindWorkflow = {
  name: 'find-workflow',
  fn: testFindWorkflowFn
}

module.exports = { testFindWorkflow }
