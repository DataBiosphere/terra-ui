const failedJobTemplate = ({ CIRCLE_JOB, CIRCLE_PROJECT_REPONAME, CIRCLE_BUILD_URL }) => [
  {
    type: 'divider'
  },
  {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `${new Date().toLocaleString('en-US')}`
      }
    ]
  },
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: ':boom: CircleCI Failed Test',
      emoji: true
    }
  },
  {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Project*: ${CIRCLE_PROJECT_REPONAME}`
      },
      {
        type: 'mrkdwn',
        text: `*Job*: ${CIRCLE_JOB}`
      }
    ]
  },
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View'
        },
        style: 'primary',
        url: `${CIRCLE_BUILD_URL}`
      }
    ]
  }
]


module.exports = { failedJobTemplate }
