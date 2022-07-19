const failed = ({ TEST_NAME, CIRCLE_JOB, CIRCLE_PROJECT_REPONAME, CIRCLE_BRANCH, CIRCLE_USERNAME, CIRCLE_BUILD_URL }) =>
  [
    {
      'type': 'divider'
    },
    {
      'type': 'header',
      'text': {
        'type': 'plain_text',
        'text': ':fire: Job Failed',
        'emoji': true
      }
    },
    {
      type: 'section',
      fields: [
        {
          'type': 'mrkdwn',
          'text': `*Job*: ${CIRCLE_JOB}`
        },
        {
          'type': 'mrkdwn',
          'text': `*Test*: ${TEST_NAME}`
        },
        {
          type: 'mrkdwn',
          text: `*Project*: ${CIRCLE_PROJECT_REPONAME}`
        },
        {
          type: 'mrkdwn',
          text: `*Branch*: ${CIRCLE_BRANCH}`
        },
        {
          type: 'mrkdwn',
          text: `*Author*: ${CIRCLE_USERNAME}`
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Job",
            "emoji": true
          },
          "style": "primary",
          "url": `${CIRCLE_BUILD_URL}`
        }
      ]
    },
    {
      'type': 'divider'
    }
  ]


module.exports = { failed }
