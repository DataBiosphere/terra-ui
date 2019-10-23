const { click, findText, findClickable, fillIn, select, waitForNoSpinners, signIntoTerra } = require(
  './integration-utils')
const { fireCloud } = require('./fire-cloud-utils.js')


const setUpWorkSpace = async workspaceName => {
  await page.goto('http://localhost:3000/#workspaces')
  await findText(page, 'requires a Google Account')
  await page.evaluate(token => window.forceSignIn(token), process.env.TERRA_TOKEN)
  try {
    await findText(page, workspaceName)
  } catch (e) {
    await findClickable(page, 'New Workspace')
    await waitForNoSpinners(page)
    await click(page, 'New Workspace')
    await fillIn(page, 'Workspace name', workspaceName)
    await select(page, 'Billing project', 'general-dev-billing-account')
    await fillIn(page, 'Description', '# This is a workspace for testing cuj2')
    await click(page, 'Create Workspace')
    await waitForNoSpinners(page)
  }
}

const ensureExportPageIsGood = async () => {
  await findText(page, `${workFlowName}-configured`)
  await findText(page, 'inputs')
}

const workSpaceName = 'Workspace for CUJ2' // steal the randomized prefix logic from Pete's CUJ1 for this
const workFlowName = 'haplotypecaller-gvcf-gatk4'

test('integration', async () => {
  await setUpWorkSpace(workSpaceName)

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
  await fireCloud.click(page, 'use-selected-configuration-button')
  await fireCloud.openFireCloudSelector(page, workSpaceName)
  await fireCloud.click(page, 'import-export-confirm-button')
  await fireCloud.click(page, 'Yes')
  await signIntoTerra(page)
  await waitForNoSpinners(page)
  await ensureExportPageIsGood()
}, 60 * 1000)
