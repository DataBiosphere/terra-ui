const pRetry = require('p-retry')
const { click, clickable, findInGrid } = require('./integration-utils')


const launchWorkflowAndWaitForSuccess = async page => {
  await click(page, clickable({ text: 'Run analysis' }))
  // If general ajax logging is disabled, uncomment the following to debug the sporadically failing
  // checkBucketAccess call.
  // const stopLoggingPageAjaxResponses = logPageAjaxResponses(page)
  await Promise.all([
    page.waitForNavigation(),
    click(page, clickable({ text: 'Launch' }))
  ])
  // stopLoggingPageAjaxResponses()

  const start = Date.now()
  await pRetry(async () => {
    try {
      await findInGrid(page, 'Succeeded', { timeout: 65 * 1000 }) // long enough for the submission details to refresh
    } catch (e) {
      try {
        await findInGrid(page, 'Running', { timeout: 1000 })
        console.info(`Workflow is running, elapsed time (minutes): ${(Date.now() - start) / (1000 * 60)}`)
      } catch (e) {
        console.info(`Workflow not yet running, elapsed time (minutes): ${(Date.now() - start) / (1000 * 60)}`)
      }
      throw new Error(e)
    }
  },
  // Note about retries value:
  // If there is a large backlog of workflows in the environment (for example, if there has been a large submission), workflows
  // might sit in "Submitted" for a very long time. In that situation, it is possible that this test will fail even with a 12-minute
  // retries value. The test runner will kill any test that goes over 15 minutes though, so keep retries under that threshold.
  // BW-1057 should further reduce this retries value after changes have been implemented to move workflows through Cromwell more quickly.
  { retries: 12, factor: 1 }
  )
}

module.exports = { launchWorkflowAndWaitForSuccess }
