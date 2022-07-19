const fetch = require('node-fetch')


const defaultToken = process.env.SLACK_BOT_TOKEN
const defaultChannelId = process.env.SLACK_CHANNEL_ID // // export SLACK_CHANNEL_ID=C03ESC8SRPB (alexw-slack-app-testing)

// https://api.slack.com/methods/chat.postMessage
const apiUrl = 'https://slack.com/api/chat.postMessage'

const headers = {
  'Content-type': 'application/json; charset=utf8',
  Authorization: `Bearer ${defaultToken}`
}


const postMessage = async (channel, { blocks }) => {
  if (!defaultToken) {
    console.error('Please specify environment variable SLACK_BOT_TOKEN when post a Slack message.')
  }

  // console.log(`Posting a message to slack channel: ${channel}.\nBlock: ${blocks}\nText: ${text}`)
  const reqBody = {
    channel,
    blocks: blocks
  }
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody)
    })

    const respJson = await response.json()
    if (respJson.ok) {
      // console.log(`**  INFO: ${new Date().toTimeString()}: Posted message to Slack successfully\n`, respJson)
    } else {
      console.error(`**  ERROR: ${new Date().toTimeString()}: Failed to post a message to Slack. Error:`, respJson.error)
    }

    return respJson
  } catch (e) {
    console.error('Unexpected Error during post message to Slack:', e)
  }
}

module.exports = {
  postMessage
}
