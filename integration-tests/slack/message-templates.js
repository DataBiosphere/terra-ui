const {
  JOB_NAME: CIRCLE_JOB,
  JOB_BUILD_NUM: CIRCLE_BUILD_NUM,
  CIRCLE_PROJECT_REPONAME,
  CIRCLE_SHA1,
  CIRCLE_USERNAME
} = process.env

const printTimestamp = () => {
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `*Generated at*:  ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`
      }
    ]
  }
}

const printHeader = numFailedTests => {
  if (numFailedTests === 0) {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `:circleci-pass:  Terra-UI Test has Passed on CircleCI`,
        emoji: true
      }
    }
  }

  return {
    type: 'header',
    text: {
      type: 'plain_text',
      text: `:circleci-fail:  Terra-UI Test has Failed on CircleCI`
    }
  }
}

const printJobDetail = () => {
  return {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Github Project*: <https://github.com/DataBiosphere/terra-ui/commit/${CIRCLE_SHA1} | ${CIRCLE_PROJECT_REPONAME}>`
      },
      {
        type: 'mrkdwn',
        text: `*User*: ${CIRCLE_USERNAME}`
      },
      {
        type: 'mrkdwn',
        text: `*Job*: <https://circleci.com/gh/DataBiosphere/terra-ui/${CIRCLE_BUILD_NUM} | ${CIRCLE_JOB}>`
      },
      {
        type: 'mrkdwn',
        text: `*Job Build Number*: ${CIRCLE_BUILD_NUM}`
      }
    ]
  }
}

// any non-zero number to indicate test(s) has failed in circleci job
const printMessageTemplate = (numFailedTests = 0) => [
  printHeader(numFailedTests),
  printTimestamp(),
  printJobDetail()
]

module.exports = { printMessageTemplate }
