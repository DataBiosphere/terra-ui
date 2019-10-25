const { click, findText, signIntoTerra } = require('./integration-utils')
const firecloud = require('./fire-cloud-utils')


const workflowName = 'haplotypecaller-gvcf-gatk4'

test.skip('integration', async () => {
  await page.goto('localhost:3000')
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
  await firecloud.selectWorkspace(page, 'general-dev-billing-account', process.env.WORKSPACE)
  await firecloud.click(page, 'import-export-confirm-button')
  await click(page, 'Yes')

  await signIntoTerra(page)
  await findText(page, `${workflowName}-configured`)
  await findText(page, 'inputs')
}, 60 * 1000)
