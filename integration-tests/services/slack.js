const { WebClient } = require('@slack/web-api')

// Create a new instance of the WebClient class with the token read from your environment variable
const web = new WebClient(process.env.SLACK_BOT_TOKEN)
// The current date
const currentTime = new Date().toTimeString()

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
  },

  chooseTeamSlackChannelId: async testName => {

  }
}

/*
   module.exports = {
   send: async params => {
   const blocks = templates[params.type](params);

   const res = await web.chat.postMessage({
   channel: conversationId,
   ...blocks
   });

   return res.ts && 200;
   }
   }
 */
