const { click, findText, waitForNoSpinners, signIntoTerra } = require('./integration-utils')
const { firecloud } = require('./fire-cloud-utils.js')


const workflowName = 'haplotypecaller-gvcf-gatk4'

test('integration', async () => {
  await page.goto('localhost:3000')
  await click(page, 'View Examples')
  await signIntoTerra(page)
  await findText(page, 'GATK4 example workspaces')
  await click(page, 'code & workflows')
  await click(page, workflowName)

  await firecloud.signIntoFirecloud(page)
  await waitForNoSpinners(page)
  await findText(page, workflowName)
  await firecloud.click(page, 'Export to Workspace...')
  await waitForNoSpinners(page)
  await findText(page, `gatk/${workflowName}-configured`)
  await firecloud.click(page, `gatk-${workflowName}-configured-1-link`)
  await waitForNoSpinners(page)
  await firecloud.click(page, 'use-selected-configuration-button')
  await waitForNoSpinners(page)
  await findText(page, 'Select a workspace')
  await firecloud.selectWorkspace(page, 'general-dev-billing-account', process.env.WORKSPACE)
  await firecloud.click(page, 'import-export-confirm-button')
  await firecloud.click(page, 'Yes')

  await signIntoTerra(page)
  await waitForNoSpinners(page)
  await findText(page, `${workflowName}-configured`)
  await findText(page, 'inputs')
}, 60 * 1000)
