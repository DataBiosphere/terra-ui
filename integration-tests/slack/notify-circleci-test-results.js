const fs = require('fs')
const _ = require('lodash/fp')
const { getFailedTestNamesFromArtifacts } = require('./circleci-utils')
const { getMessageBlockTemplate } = require('./message-templates')
const { postMessage } = require('./post-message')


/**
 * Get a map object of Slack channel IDs and array of test names for failed tests notification
 * @param { Array[string] } failedTests
 * @returns { Map<string, Array[string]> } A map object where key is channel_id, value is test_names array
 */
const getFailedTestsAndChannelIDs = failedTests => {
  const { fail: jsonBlock } = JSON.parse(fs.readFileSync('./slack/slack-notify-channels.json', 'utf8'))
  const idsAndNames = new Map() // Map<string, Array[string]>
  _.forEach(item => {
    const channelId = _.get('id', item)
    const { tests } = item
    const testNames = _.map(test => test.name, tests)
    idsAndNames.set(channelId, testNames)
  }, jsonBlock)

  const filteredIDsAndNames = new Map() // Map<string, Array[string]>
  _.forEach(test => {
    const channelIdsForFailedTest = Array.from(idsAndNames.keys())
      .filter(key => idsAndNames.get(key).includes(test) || idsAndNames.get(key).length === 0)
    if (channelIdsForFailedTest.length === 0) {
      throw new Error(`Test: ${test} was not found in slack-notify-channels.json`)
    }
    _.forEach(channelId => filteredIDsAndNames.has(channelId) ? filteredIDsAndNames.get(channelId).push(test) : filteredIDsAndNames.set(channelId, new Array(test)),
      channelIdsForFailedTest
    )
  }, failedTests)

  return filteredIDsAndNames
}

/**
 * Get array of Slack channel IDs for succeeded job notification
 * @returns { Array[string] }
 */
const getSlackChannelIDsForPassedTests = () => {
  const { pass: jsonBlock } = JSON.parse(fs.readFileSync('./slack/slack-notify-channels.json', 'utf8'))
  return _.map(_.get('id'), jsonBlock)
}

// Post CircleCI UI test report to Slack channels
const notifyCircleCITestResults = async () => {
  const failedTestNames = await getFailedTestNamesFromArtifacts()

  if (failedTestNames.length === 0) {
    // Slack notification: CircleCI job succeeded
    const channelIDs = getSlackChannelIDsForPassedTests()
    const messageBlocks = getMessageBlockTemplate(failedTestNames)
    // Post same message blocks for all Slack channels
    _.forEach(async channelId => await postMessage({ channel: channelId, blocks: messageBlocks }), channelIDs)
    return
  }

  // Slack notification: CircleCI job failed. Message contains list of failed test names.
  const channelIDsAndNames = getFailedTestsAndChannelIDs(failedTestNames)
  // Slack issue: No way to post the same message to multiple channels at once. https://github.com/slackapi/bolt-js/issues/696
  _.forEach(async ([channelId, testNames]) => {
    const messageBlocks = getMessageBlockTemplate(testNames)
    await postMessage({ channel: channelId, blocks: messageBlocks })
  }, _.toPairs(channelIDsAndNames))
}

(async () => {
  await notifyCircleCITestResults()
})()
