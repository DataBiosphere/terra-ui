// This test is owned by the Interactive Analysis (IA) Team.
const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace, performAnalysisTabSetup } = require('../utils/integration-helpers')
const {
  click, clickable, findElement, noSpinnersAfter, fillIn, findIframe, findText, dismissNotifications, getAnimatedDrawer, image, input
} = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')


const rFileName = 'test-rmd'

const testRunRStudioFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser
)(async ({ workspaceName, page, testUrl, token }) => {
  await performAnalysisTabSetup(page, token, testUrl, workspaceName)

  // Create analysis file
  await click(page, clickable({ textContains: 'Start' }))
  await findElement(page, getAnimatedDrawer('Select an application'))
  await click(page, image({ text: 'Create new R file' }))
  await fillIn(page, input({ placeholder: 'Enter a name' }), rFileName)
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create Analysis' })) })

  // Close the create cloud env modal that pops up
  await noSpinnersAfter(page, {
    action: () => findText(page, 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).')
  })

  await click(page, clickable({ textContains: 'Close' }))

  // Navigate to analysis launcher
  await findElement(page, clickable({ textContains: rFileName }))
  await click(page, clickable({ textContains: rFileName }))
  await dismissNotifications(page)

  await noSpinnersAfter(page, {
    action: () => click(page, clickable({ textContains: 'Open' }))
  })

  //Create a cloud env from analysis launcher
  await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })) })
  await findElement(page, clickable({ textContains: 'RStudio Environment ( Creating )' }), { timeout: 40000 })

  // Wait for the environment to be running
  await findElement(page, clickable({ textContains: 'RStudio Environment ( Running )' }), { timeout: 10 * 60000 })
  await dismissNotifications(page)
  await click(page, clickable({ textContains: 'Open' }))

  // Find the iframe, wait until the RStudio iframe is loaded, and execute some code
  const frame = await findIframe(page, '//iframe[@title="Interactive RStudio iframe"]')

  await findElement(frame, '//*[@id="rstudio_container"]', { timeout: 60000 })
  await fillIn(frame, '//textarea', 'x=1;x')
  await page.keyboard.press('Enter')
  await findText(frame, '[1] 1')

  await dismissNotifications(page)
})

registerTest({
  name: 'run-rstudio',
  fn: testRunRStudioFn,
  timeout: 20 * 60 * 1000
})
