const fetch = require('node-fetch')
const { testUrl } = require('../utils/integration-config')
const { withWorkspace } = require('../utils/integration-helpers')
const { click, clickable, findText, select, signIntoTerra } = require('../utils/integration-utils')


const testWorkflowIdentifier = 'github.com/DataBiosphere/topmed-workflows/UM_variant_caller_wdl:1.32.0'

const testImportDockstoreWorkflowFn = async ({ context }) => {
  const page = await context.newPage()

  const { dockstoreUrlRoot } = await fetch(`${testUrl}/config.json`).then(res => res.json())

  if (await fetch(`${dockstoreUrlRoot}/api/api/ga4gh/v1/metadata`).then(res => res.status !== 200)) {
    console.error('Skipping dockstore test, API appears to be down')
  } else {
    await withWorkspace(async ({ workspaceName }) => {
      await page.goto(`${testUrl}/#import-tool/dockstore/${testWorkflowIdentifier}`)
      await signIntoTerra(page)
      await findText(page, 'workflow TopMedVariantCaller')
      await select(page, 'Select a workspace', workspaceName)
      await click(page, clickable({ text: 'Import' }))
      await findText(page, testWorkflowIdentifier)
    })({ context })
  }
}

const testImportDockstoreWorkflow = {
  name: 'import workflow from dockstore',
  fn: testImportDockstoreWorkflowFn
}

module.exports = { testImportDockstoreWorkflow }
