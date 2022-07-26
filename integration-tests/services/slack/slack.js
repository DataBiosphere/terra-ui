const { postMessage } = require('./post-message.js')
const { WebClient, LogLevel } = require('@slack/web-api')
const fs = require('fs')
const _ = require('lodash/fp')
const { printFailedJobTemplate, printSucceededJobTemplate } = require('./message-templates')
const { getChannelsNotifySuccess } = require('./slack-utils')


// Create a new instance of the WebClient class with the token read from your environment variable
const web = new WebClient(process.env.SLACK_BOT_TOKEN, {
  logLevel: LogLevel.DEBUG
})

const logDir = process.env.LOG_DIR || '/tmp/test-results'

const getFailedTestFiles = () => {
  return fs.readdirSync(logDir).filter(f => f.match(/failed-tests-[0-9]*.json/))
}

const readFiles = (jsonFiles) => {
  // const jsonFiles = getFailedTestFiles()
  // console.log(files)

  const combinedMap = new Map()
  _.forEach(file => {
    const data = JSON.parse(fs.readFileSync(`${logDir}/${file}`, 'utf8'))
    // console.log(data, '\n')

    _.forEach(async ([k, v]) => {
      console.log('v:', v)
      if (combinedMap.has(k)) {
        // filter out duplicates
        combinedMap.set(k, v.concat(combinedMap.get(k).filter((item) => v.indexOf(item) < 0)))
      } else {
        combinedMap.set(k, v)
      }
      console.log('\n\n**')
    }, _.entries(Object.fromEntries(data)))

    console.log('***\ncombinedMap:', combinedMap)

  }, jsonFiles)
  return combinedMap
}

// notify success
const notifySucceededJobToAllChannels = () => {
  const mock = {
    CIRCLE_PROJECT_REPONAME: 'terra-ui',
    CIRCLE_BRANCH: 'dev',
    CIRCLE_JOB: 'integration-tests-staging',
    CIRCLE_BUILD_URL: 'https://circleci.com/gh/DataBiosphere/terra-ui/47116',
    CIRCLE_BUILD_NUM: '47116',
    CIRCLE_NODE_INDEX: 0,
    CIRCLE_SHA1: '4b4aae6d835030eb1c1a69ad770776aca07ea39e'
  }

  const blocks = printSucceededJobTemplate(_.merge(mock, process.env))
  // console.log('\n%s\n', JSON.stringify(blocks))
  const channels = getChannelsNotifySuccess()
  _.forEach(async channel => await postMessage({ channel, blocks }), channels)
}

const notifyFailedJobToAllChannels = async (channelAndTestMap) => {
  const mock = {
    CIRCLE_PROJECT_REPONAME: 'terra-ui',
    CIRCLE_BRANCH: 'dev',
    CIRCLE_JOB: 'integration-tests-staging',
    CIRCLE_BUILD_URL: 'https://circleci.com/gh/DataBiosphere/terra-ui/47116',
    CIRCLE_BUILD_NUM: '47116',
    CIRCLE_NODE_INDEX: 0,
    CIRCLE_SHA1: '4b4aae6d835030eb1c1a69ad770776aca07ea39e'
  }

  _.forEach(async ([k, v]) => {
    // key is channel_id. value is names array.
    const blocks = printFailedJobTemplate(_.merge(mock, process.env))
    blocks.push({
      type: 'section',
      fields:
        [
          {
            type: 'mrkdwn',
            text: `:fail2:  Test Suites:\n\`\`\`*  ${v.join('\n*  ')}\`\`\``
          }
        ]
    })
    console.log('\n%s\n', JSON.stringify(blocks))
    await postMessage({ channel: k, blocks })
  }, _.entries(channelAndTestMap))
}

// Post a message to Slack channels
const postNow = async () => {
  const currentTime = new Date().toTimeString()
  console.log(`Process Slack at ${currentTime}`)

  const testFiles = getFailedTestFiles()
  console.log('testFiles.length:', testFiles.length)
  if (testFiles.length === 0) {
    await notifySucceededJobToAllChannels()
  } else {
    const data = readFiles(testFiles)
    await notifyFailedJobToAllChannels(data)
  }

  /*
  const channel = 'C03ESC8SRPB'
  const blocks = '[{"type": "section","text": {"type": "mrkdwn","text": "bar"}}]'

  await postMessage({
    channel: channel,
    blocks: blocks
  })
  */

}

postNow()

/*
 module.exports = {
    send: async opts => {
      try {
       // Use the `chat.postMessage` method to send a message from this app
       await web.chat.postMessage({
          channel: '#alexw-slack-app-testing',
          text: `The current time is ${currentTime}`
       })
       console.log('Message posted!')
       } catch (error) {
          console.log(error)
       }
   }
 }

 module.exports = {
   send: async params => {
   const blocks = templates[params.type](params);

   const res = await web.chat.postMessage({
      channel: conversationId,
      ...blocks
   })

   return res.ts && 200;
   }
 }
 */
