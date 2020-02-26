const fetch = require('node-fetch')
const { withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, dismissNotifications, findText, select, signIntoTerra } = require('../utils/integration-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const testWorkflowIdentifier = 'github.com/DataBiosphere/topmed-workflows/UM_variant_caller_wdl:1.32.0'

const testImportDockstoreWorkflowFn = withUserToken(async options => {
  const { page, testUrl } = options
  const { dockstoreUrlRoot } = await fetch(`${testUrl}/config.json`).then(res => res.json())

  if (await fetch(`${dockstoreUrlRoot}/api/api/ga4gh/v1/metadata`).then(res => res.status !== 200)) {
    console.error('Skipping dockstore test, API appears to be down')
  } else {
    await withWorkspace(async ({ token, workspaceName }) => {
      await page.goto(`${testUrl}/#import-tool/dockstore/${testWorkflowIdentifier}`)
      await signIntoTerra(page, token)
      await dismissNotifications(page)
      await findText(page, 'workflow TopMedVariantCaller')
      await select(page, 'Select a workspace', workspaceName)
      await click(page, clickable({ text: 'Import' }))
      await findText(page, testWorkflowIdentifier)
    })(options)
  }
})

const testImportDockstoreWorkflow = {
  id: 'import-dockstore-workflow',
  name: 'import workflow from dockstore',
  fn: testImportDockstoreWorkflowFn
}

module.exports = { testImportDockstoreWorkflow }
