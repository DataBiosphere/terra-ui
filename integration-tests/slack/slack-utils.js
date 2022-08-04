const fs = require('fs')
const _ = require('lodash/fp')
const fetch = require('node-fetch')
const { parse } = require('path')
const { postMessage } = require('./post-message')
const { printMessageTemplate } = require('./message-templates')


const {
  SLACK_BOT_TOKEN: defaultToken,
  JOB_BUILD_NUM: circleJobBuildNum
} = process.env

/**
 * Fetch CircleCI artifact links to tests summary JSON files (were created in onRunComplete() in jest-reporter.js)
 * @param { string } token
 * @param { string } buildNum
 * @returns { Promise<Array[string]> } URL to tests-summary-[0-9].json
 */
const fetchCircleJobArtifacts = async ({ token = defaultToken, buildNum = circleJobBuildNum } = {}) => {
  if (!buildNum) {
    throw new Error(`**  ERROR: Missing CircleCI build number. Failed to fetch CircleCI job artifacts.`)
  } else if (!token) {
    throw new Error(`**  ERROR: Missing CircleCI API token. Failed to fetch CircleCI job artifacts.`)
  }

  // Find more arguments and details of the response: https://circleci.com/docs/api/v2/index.html#operation/getJobArtifacts
  const apiUrl = 'https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui'
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` }

  try {
    const response = await fetch(`${apiUrl}/${buildNum}/artifacts`, { method: 'GET', headers })
    const json = await response.json()
    const { items } = json
    const filtered = _.filter(item => item['path'].toString().includes('tests-summary'), items)
    return filtered.map(item => item.url)
  } catch (e) {
    console.error(`**  ERROR: Encountered unexpected error when getting CircleCI build_number: ${buildNum} artifacts:`, e)
    throw e
  }
}

const getFailedTestFileName = aggregatedResult => {
  const failedTests = []
  _.forEach(testResult => {
    if (testResult.numFailingTests > 0) {
      failedTests.push(parse(testResult.testFilePath).name)
    }
  }, aggregatedResult.testResults)
  return failedTests
}

/**
 *
 * @returns {Promise<Array>}
 */
const getFailedTests = async () => {
  const headers = { Accept: 'application/json' }
  const urls = await fetchCircleJobArtifacts()
  const tests = []
  for (const url of urls) {
    try {
      // Parse all tests-summary JSON for failed tests
      const response = await fetch(url, { method: 'GET', headers })
      const json = await response.json()
      const failedTest = getFailedTestFileName(json)
      tests.push(...failedTest)
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
 * @returns { Map<string, Array[string]> }
 */
const getChannelsNotifyFailed = failedTests => {
  const channels = new Map()
  const data = JSON.parse(fs.readFileSync('./slack/slack-notify-channels.json', 'utf8'))
  const { fail: jsonItems } = data

  _.forEach(item => {
    const id = _.get(['id'], item)
    const { tests } = item
    const names = _.map(item => item.name, tests)
    channels.set(id, names)
  }, jsonItems)

  // Construct a map object: key: channel_id, value: test_names array
  const idsMap = new Map()
  _.forEach(test => {
    const filtered = Array.from(channels.keys())
      .map(key => channels.get(key).includes(test) || channels.get(key).length === 0 ? key : undefined)
      .filter(key => key)
    if (filtered.length === 0) {
      throw new Error(`Test: ${test} was not found in slack-notify-channels.json`)
    }
    _.forEach(k => idsMap.has(k) ? idsMap.get(k).push(test) : idsMap.set(k, new Array(test)), filtered)
  }, failedTests)

  return idsMap
}

/**
 * Slack to notify job failed. Message contains failed test names.
 * @param { Array[string] } failedTests
 * @returns { Promise<void> }
 */
// eslint-disable-next-line
const notifyFailure = async failedTests => {
  const data = getChannelsNotifyFailed(failedTests)
  // Slack issue: No way to post the same message to multiple channels at once. https://github.com/slackapi/bolt-js/issues/696
  _.forEach(async ([k, v]) => {
    // k is channel_id. v is test_name array.
    const blocks = printMessageTemplate(1)
    blocks.push({
      type: 'section',
      fields:
        [
          {
            type: 'mrkdwn',
            text: `:errrrr:  Tests:\n\`\`\`*  ${v.join('\n*  ')}\`\`\``
          }
        ]
    })
    await postMessage({ channel: k, blocks })
  }, _.toPairs(data))
}

// Slack to notify job succeeded
const notifySuccess = () => {
  const blocks = printMessageTemplate()
  const data = JSON.parse(fs.readFileSync('./slack/slack-notify-channels.json', 'utf8'))
  const { pass: passNotifyChannels } = data
  const channels = []
  _.forEach(key => channels.push(_.get(['id'], key)), passNotifyChannels)
  _.forEach(async channel => await postMessage({ channel, blocks }), channels)
}

module.exports = {
  getFailedTests,
  notifyFailure,
  notifySuccess
}
