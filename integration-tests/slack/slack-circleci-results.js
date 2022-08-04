const { getFailedTests, notifyFailure, notifySuccess } = require('./slack-utils')


// Post CircleCI UI test report to Slack channels
const postCircleTestResults = async () => {
  const allFailedTests = await getFailedTests()
  if (allFailedTests.length === 0) {
    await notifySuccess()
  } else {
    await notifyFailure(allFailedTests)
  }
}

(async () => {
  await postCircleTestResults()
})()
