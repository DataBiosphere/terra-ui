const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, signIntoTerra, findElement, navChild, noSpinnersAfter, select, fillIn, input, findIframe, findText
} = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')


const notebookName = 'TestNotebook'

const testRunNotebookFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser
)(async ({ workspaceName, page, testUrl, token }) => {
  await signIntoTerra(page, { token, testUrl })

  await click(page, clickable({ textContains: 'View Workspaces' }))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: workspaceName })), debugMessage: '1' })
  await click(page, navChild('notebooks'))
  await click(page, clickable({ textContains: 'Create a' }))
  await fillIn(page, input({ placeholder: 'Enter a name' }), notebookName)
  await select(page, 'Language', 'Python 3')

  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Notebook' })), debugMessage: '2' })
  await click(page, clickable({ textContains: notebookName }))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Open' })), debugMessage: '3' })

  await findElement(page, getAnimatedDrawer('Cloud Environment'))
  await click(page, clickable({ text: 'Create' }))
  await findElement(page, clickable({ textContains: 'Creating', isEnabled: false }))
  await findElement(page, clickable({ textContains: 'Running' }), { timeout: 10 * 60 * 1000 })

  const frame = await findIframe(page)

  await findElement(frame, '//*[@title="Kernel Idle"]')
  await fillIn(frame, '//textarea', 'print(123456789099876543210990+9876543219)')
  await click(frame, clickable({ text: 'Run' }))
  await findText(frame, '123456789099886419754209')

  // Save notebook to avoid "unsaved changes" modal when test tear-down tries to close the window
  await click(frame, clickable({ text: 'Save and Checkpoint' }))
})

registerTest({
  name: 'run-notebook',
  fn: testRunNotebookFn,
  timeout: 20 * 60 * 1000,
  targetEnvironments: ['alpha', 'perf', 'staging']
})
