const { makeWorkspace, deleteWorkspace } = require('./integration-helpers')
const { click, findText, signIntoTerra, findClickable, waitForNoSpinners } = require('./integration-utils')
const firecloud = require('./firecloud-utils')


const workflowName = 'haplotypecaller-gvcf-gatk4'
const billingAccount = 'general-dev-billing-account'

const url = 'http://localhost:3000'

const test = async () => {
  page.setDefaultTimeout(60 * 1000)
  const workspaceName = await makeWorkspace()
  try {
    await page.goto(url)
    await click(page, 'View Examples')
    await signIntoTerra(page)
    await click(page, 'code & workflows')
    await click(page, workflowName)

    await firecloud.signIntoFirecloud(page)
    await findText(page, workflowName)
    await click(page, 'Export to Workspace...')
    await click(page, `${workflowName}-configured`)
    await click(page, 'Use Selected Configuration')
    await findText(page, 'Select a workspace')
    await firecloud.selectWorkspace(page, billingAccount, workspaceName)
    await firecloud.click(page, 'import-export-confirm-button')

    /* This else/if is necessary to "hack" going back to localhost:3000-Terra after going to Firecloud,
     without these lines it will redirect to dev-Terra even if started out at localhost:3000-Terra */
    if (url === 'http://localhost:3000') {
      await findClickable(page, 'Yes')
      const yesButtonHrefDetails = (await page.$x('//a[contains(text(), "Yes")]/@href'))[0]
      const redirectURL = (await page.evaluate(yesButton => yesButton.textContent, yesButtonHrefDetails)).replace(
        'https://bvdp-saturn-dev.appspot.com',
        url)
      console.log(redirectURL)
      await page.goto(redirectURL)
    } else {
      await click(page, 'Yes')
    }

    await findText(page, 'requires a Google Account')
    await signIntoTerra(page)
    await findText(page, `${workflowName}-configured`)
    await findText(page, 'inputs')
    await deleteWorkspace(workspaceName)
  } catch (e) {
    await deleteWorkspace(workspaceName)
    console.log('deleted')
    throw e
  }
}

module.exports = test
