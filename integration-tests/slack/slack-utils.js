const fs = require('fs')
const _ = require('lodash/fp')
const fetch = require('node-fetch')
const { parse } = require('path')
const { postMessage } = require('./post-message')
const { getMessageBlockTemplate } = require('./message-templates')


const {
  JOB_BUILD_NUM: circleJobBuildNum
} = process.env

/**
 * Fetch CircleCI artifact links to tests summary JSON files (were created in onRunComplete() in jest-reporter.js)
 * @param { string } token
 * @param { string } buildNum
 * @returns { Promise<Array[string]> } URL to tests-summary-[0-9].json
 */
const fetchCircleJobArtifacts = async ({ buildNum = circleJobBuildNum } = {}) => {
  if (!buildNum) {
    throw new Error(`**  ERROR: Missing CircleCI build number. Failed to fetch CircleCI job artifacts.`)
  }

  // Find more arguments and details of the response: https://circleci.com/docs/api/v2/index.html#operation/getJobArtifacts
  const apiUrlRoot = 'https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui'

  try {
    const response = await fetch(`${apiUrlRoot}/${buildNum}/artifacts`)
    const { items } = await response.json()
    const testSummaryArtifacts = _.filter(_.flow(_.get('path'), _.includes('tests-summary')), items)
    return _.map(_.get('url'), testSummaryArtifacts)
  } catch (e) {
    console.error(`**  ERROR: Encountered unexpected error when getting CircleCI build_number: ${buildNum} artifacts.`, e)
    throw e
  }
}

/**
 *
 * @param { string }aggregatedResult
 * @returns { Array[string] }
 */
const getFailedTestFileNames = aggregatedResult => {
  return _.flow(
    _.filter(testResult => testResult.numFailingTests > 0),
    _.map(testResult => parse(testResult.testFilePath).name)
  )(aggregatedResult.testResults)
}

/**
 *
 * @returns { Promise<Array[string]> }
 */
const getFailedTests = async () => {
  const urls = await fetchCircleJobArtifacts()
  const tests = []
  for (const url of urls) {
    try {
      // Parse all tests-summary JSON for failed tests
      const response = await fetch(url)
      const failedTests = getFailedTestFileNames(await response.json())
      tests.push(...failedTests)
    } catch (e) {
      console.error(`**  ERROR: Encountered unexpected error when getting CircleCI artifacts tests-summary file: ${url}.`, e)
      throw e
    }
  }
  return tests
}

/**
 *
 * @param { Array[string] } failedTests
 * @returns { Map<string, Array[string]> } A map object where key is channel_id, value is test_names array
 */
const getChannelsNotifyFailed = failedTests => {
  const { fail: failJsonBlock } = JSON.parse(fs.readFileSync('./slack/slack-notify-channels.json', 'utf8'))
  const channelIdsAndTests = new Map() // Map<string, Array[string]>()
  _.forEach(item => {
    const channelId = _.get(['id'], item)
    const { tests } = item
    const testNames = _.map(item => item.name, tests)
    channelIdsAndTests.set(channelId, testNames)
  }, failJsonBlock)

  const idsAndTestsMap = new Map() // Map<string, Array[string]>()
  _.forEach(test => {
    const channelIdsForFailedTest = Array.from(channelIdsAndTests.keys())
      .filter(key => channelIdsAndTests.get(key).includes(test) || channelIdsAndTests.get(key).length === 0)
    if (channelIdsForFailedTest.length === 0) {
      throw new Error(`Test: ${test} was not found in slack-notify-channels.json`)
    }
    _.forEach(channelId => idsAndTestsMap.has(channelId) ? idsAndTestsMap.get(channelId).push(test) : idsAndTestsMap.set(channelId, new Array(test)),
      channelIdsForFailedTest
    )
  }, failedTests)

  return idsAndTestsMap
}

/**
 * Slack to notify job failed. Message contains failed test names.
 * @param { Array[string] } failedTests
 * @returns { Promise<void> }
 */
const notifyFailure = failedTests => {
  const idsAndTestsMap = getChannelsNotifyFailed(failedTests)
  // Slack issue: No way to post the same message to multiple channels at once. https://github.com/slackapi/bolt-js/issues/696
  _.forEach(async ([channelId, testNames]) => {
    const blocks = getMessageBlockTemplate(failedTests.length)
    blocks.push({
      type: 'section',
      fields:
        [
          {
            type: 'mrkdwn',
            text: `\`\`\`*  ${testNames.join('\n*  ')}\`\`\``
          }
        ]
    })
    await postMessage({ channel: channelId, blocks })
  }, _.toPairs(idsAndTestsMap))
}

// Slack to notify job succeeded
const notifySuccess = () => {
  const blocks = getMessageBlockTemplate()
  const { pass: passNotifyChannels } = JSON.parse(fs.readFileSync('./slack/slack-notify-channels.json', 'utf8'))
  const channelIds = _.map(_.get('id'), passNotifyChannels)
  _.forEach(async channelId => await postMessage({ channelId, blocks }), channelIds)
}

module.exports = {
  getFailedTests,
  notifyFailure,
  notifySuccess
}
