const { click, findText, waitForNoSpinners, signIntoTerra } = require(
  './integration-utils')
const { fireCloud } = require('./fire-cloud-utils.js')


const workFlowName = 'haplotypecaller-gvcf-gatk4'

test.skip('integration', async () => {
  await page.goto('localhost:3000')
  await click(page, 'View Examples')
  await signIntoTerra(page)
  await findText(page, 'GATK4 example workspaces')
  await click(page, 'code & workflows')
  await click(page, workFlowName)

  await fireCloud.signIntoFireCloud(page)
  await waitForNoSpinners(page)
  await findText(page, workFlowName)
  await fireCloud.click(page, 'Export to Workspace...')
  await waitForNoSpinners(page)
  await findText(page, `gatk/${workFlowName}-configured`)
  await fireCloud.click(page, `gatk-${workFlowName}-configured-1-link`)
  await waitForNoSpinners(page)
  await fireCloud.click(page, 'use-selected-configuration-button')
  await waitForNoSpinners(page)
  await findText(page, 'Select a workspace')
  await fireCloud.selectWorkSpace(page, 'general-dev-billing-account', process.env.WORKSPACE)
  await fireCloud.click(page, 'import-export-confirm-button')
  await fireCloud.click(page, 'Yes')

  await signIntoTerra(page)
  await waitForNoSpinners(page)
  await findText(page, `${workFlowName}-configured`)
  await findText(page, 'inputs')
}, 60 * 1000)
