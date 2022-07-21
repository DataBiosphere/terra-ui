const fetch = require('node-fetch')
const _ = require('lodash/fp')
const channels = require('./channels')
const { failed } = require('./templates')


const defaultToken = process.env.SLACK_BOT_TOKEN
const defaultChannel = process.env.SLACK_CHANNEL_ID // // export SLACK_CHANNEL_ID=C03ESC8SRPB (alexw-slack-app-testing)
const apiUrl = 'https://slack.com/api/chat.postMessage'

const postMessage = async ({ channel = defaultChannel, token = defaultToken, blocks }) => {
  if (!token) {
    console.error(`**  ERROR: Missing token. Post message to Slack channel ${channel} failed.`)
    return
  }
  const headers = {
    'Content-type': 'application/json; charset=utf8',
    Authorization: `Bearer ${token}`
  }
  const requestData = { channel, blocks }
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    })
    const respJson = await response.json()
    if (!respJson.ok) {
      console.error(`**  ERROR: ${new Date().toTimeString()}: Failed to post message to Slack channel ${channel}.`, respJson.error)
    }
    return respJson
  } catch (e) {
    console.error(`**  ERROR: Unexpected error when post message to Slack channel ${channel}.`, e)
  }
}

const getChannelIDs = (testName) => {
  return _.flow(
    _.get('tests'),
    _.find(testName),
    _.get(testName),
    _.groupBy('id'),
    _.keys
  )(channels)
}

const postFailedMessage = async (testName) => {
  if (!this.isSuccess) {
    const channels = getChannelIDs(testName)
    // console.log(ids) // array object. e.g: [ 'C03ESC8SRPB', 'C7H40L71D' ]

    await Promise.all(
      _.forEach(async channel => {
        await postMessage({
          channel: channel,
          blocks: failed(
            _.merge({
              // mocked
              TEST_NAME: testName,
              CIRCLE_PROJECT_REPONAME: 'terra-ui',
              CIRCLE_JOB: 'integration-tests-staging',
              CIRCLE_BUILD_URL: 'https://circleci.com/gh/DataBiosphere/terra-ui/47116'
            }, process.env)
          )
        })

      }, channels)
    )

  }
}

module.exports = {
  postMessage, getChannelIDs
}
