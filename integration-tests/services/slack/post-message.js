const fetch = require('node-fetch')
const _ = require('lodash/fp')
const channels = require('./channels')


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
    // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    })
    const respJson = await response.json()
    if (respJson.ok) {
      console.log(`Notified Slack channel: ${channel}`)
    } else {
      console.error(`**  ERROR: ${new Date().toTimeString()}: Post message to Slack channel ${channel} failed.`, respJson.error)
    }
    return respJson
  } catch (e) {
    console.error(`**  ERROR: Unexpected error when posting message to Slack channel ${channel}.`, e)
    throw e
  }
}

const getChannelIDs = testName => {
  return _.flow(
    _.get('tests'),
    _.find(testName),
    _.get(testName),
    _.groupBy('id'),
    _.keys
  )(channels)
}

module.exports = {
  postMessage
}
