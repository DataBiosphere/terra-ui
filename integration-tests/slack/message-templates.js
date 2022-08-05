const {
  JOB_NAME: CIRCLE_JOB,
  JOB_BUILD_NUM: CIRCLE_BUILD_NUM,
  CIRCLE_SHA1
} = process.env

const getHeaderBlock = numFailedTests => {
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

const getJobDetailBlock = () => {
  return {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Commit*: <https://github.com/DataBiosphere/terra-ui/commit/${CIRCLE_SHA1} | ${`${CIRCLE_SHA1}`.slice(0, 7)}>`
      },
      {
        type: 'mrkdwn',
        text: `*Job ${CIRCLE_BUILD_NUM}*: <https://circleci.com/gh/DataBiosphere/terra-ui/${CIRCLE_BUILD_NUM} | ${CIRCLE_JOB}>`
      }
    ]
  }
}

// any non-zero number to indicate test(s) has failed in circleci job
const getMessageBlockTemplate = (numFailedTests = 0) => [
  getHeaderBlock(numFailedTests),
  getJobDetailBlock()
]

module.exports = { getMessageBlockTemplate }
