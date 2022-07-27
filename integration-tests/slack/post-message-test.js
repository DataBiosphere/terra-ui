const { postMessage } = require('./post-message')


// Post a message to Slack channels
const postMessageTest = async () => {
  const currentTime = new Date().toTimeString()
  const channel = 'C03ESC8SRPB'
  const blocks = []
  blocks.push({
    type: 'section',
    fields:
      [
        {
          type: 'mrkdwn',
          text: `:fail2:  Test send at ${currentTime}`
        }
      ]
  })
  console.log('\n%s\n', JSON.stringify(blocks))
  await postMessage({ channel, blocks })
}

postMessageTest()
