// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace, performAnalysisTabSetup } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, findElement, noSpinnersAfter, radioButton, delay
} = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')

const testDiskReatachmentFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser
)(async ({ page, token, testUrl, workspaceName, billingProject, email }) => {
  // Navigate to appropriate part of UI (the analysis tab)
  await performAnalysisTabSetup(page, token, testUrl, workspaceName)

  // Create a runtime
  await click(page, clickable({ textContains: 'Environment Configuration' }))
  await findElement(page, getAnimatedDrawer('Cloud Environment Details'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })), debugMessage: 'abc' })
  await findElement(page, getAnimatedDrawer('Jupyter Cloud Environment'), { timeout: 40000 })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })), debugMessage: 'def' })

  // Ensure UI displays the runtime is creating and the terminal icon is present + disabled
  await findElement(page, clickable({ textContains: 'Terminal', isEnabled: false }))
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Creating )' }), { timeout: 40000 })
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Running )' }), { timeout: 10 * 60 * 1000 })

  // Get the runtime, and save runtimeID and persistentDiskId
  const runtimes = await page.evaluate(async (billingProject, email) => {
    return await window.Ajax().Runtimes.list({ googleProject: billingProject, creator: email })
  })
  const persistentDiskId = runtimes[0]['runtimeConfig']['persistentDiskId']
  const runtimeID = runtimes[0]['id']
  expect(persistentDiskId).not.toBeNull()
  expect(runtimeID).not.toBeNull()

  // Delete the environment, keep persistent disk.
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })), debugMessage: 'ghi' })
  await findElement(page, clickable({ text: 'Delete Environment' }), { timeout: 45000 })
  await click(page, clickable({ text: 'Delete Environment' }))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Delete' })), debugMessage: 'jkl' })

  // Create a runtime
  await click(page, clickable({ textContains: 'Environment Configuration' }))
  await findElement(page, getAnimatedDrawer('Cloud Environment Details'))
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })), debugMessage: 'mno' })
  await findElement(page, getAnimatedDrawer('Jupyter Cloud Environment'), { timeout: 40000 })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })), debugMessage: 'pqr' })

  // Ensure UI displays the runtime is creating and the terminal icon is present + disabled
  await findElement(page, clickable({ textContains: 'Terminal', isEnabled: false }))
  await click(page, clickable({ textContains: 'Jupyter Environment ( Creating )' }), { timeout: 40000 })
  await findElement(page, clickable({ textContains: 'Jupyter Environment ( Running )' }), { timeout: 10 * 60 * 1000 })

  const secondRuntimes = await page.evaluate(async (billingProject, email) => {
    return await window.Ajax().Runtimes.list({ googleProject: billingProject, creator: email })
  })

  const secondPersistentDiskId = secondRuntimes[0]['runtimeConfig']['persistentDiskId']
  const secondRuntimeID = secondRuntimes[0]['id']
  expect(persistentDiskId).toEqual(secondPersistentDiskId)
  expect(runtimeID).not.toEqual(secondRuntimeID)
})

registerTest({
  name: 'disk-reattachment',
  fn: testDiskReatachmentFn,
  timeout: 15 * 60 * 1000
})
