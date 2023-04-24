const fetch = require("node-fetch");

const defaultToken = process.env.SLACK_BOT_TOKEN;
const defaultChannel = process.env.SLACK_CHANNEL_ID;
const apiUrl = "https://slack.com/api";

const postMessage = async ({ channel = defaultChannel, token = defaultToken, blocks }) => {
  if (!channel) {
    throw new Error("**  ERROR: Missing Slack channel. Failed to post message to Slack.");
  } else if (!token) {
    throw new Error(`**  ERROR: Missing token. Failed to post message to Slack channel ${channel}.`);
  }

  const headers = {
    "Content-type": "application/json; charset=utf8",
    Authorization: `Bearer ${token}`,
  };

  const data = { channel, blocks };

  let responseJson;
  try {
    // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
    const fetchResponse = await fetch(`${apiUrl}/chat.postMessage`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    responseJson = await fetchResponse.json();
  } catch (e) {
    console.error(`**  ERROR: Encountered unexpected error when posting message to Slack channel: ${channel}.`, e);
    throw e;
  }
  if (responseJson.ok) {
    console.log(`Successfully posted message to Slack channel: ${channel}. Message: ${JSON.stringify(data)}`);
  } else {
    console.error(`**  ERROR: ${new Date().toTimeString()}: Failed to post message to Slack channel: ${channel}.`, responseJson.error);
    throw new Error(responseJson.error);
  }
  return responseJson;
};

module.exports = {
  postMessage,
};
