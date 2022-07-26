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


const printProjectRepo = ({ CIRCLE_PROJECT_REPONAME, CIRCLE_JOB, CIRCLE_BUILD_URL, CIRCLE_SHA1 }) => {
  return {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Project*: <https://github.com/DataBiosphere/terra-ui/commit/${CIRCLE_SHA1} | ${CIRCLE_PROJECT_REPONAME}>`
      },
      {
        type: 'mrkdwn',
        text: `*Job*: <${CIRCLE_BUILD_URL} | ${CIRCLE_JOB}>`
      }
    ]
  }
}

const printJobLink = ({ CIRCLE_BUILD_URL, CIRCLE_BUILD_NUM, CIRCLE_NODE_INDEX = 0 }) => {
  return {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Parallel Run Index*: ${CIRCLE_NODE_INDEX}`
      }
    ],
    accessory: {
      type: 'button',
      text: {
        type: 'plain_text',
        text: `Open Job ${CIRCLE_BUILD_NUM}`,
        emoji: true,
      },
      style: "primary",
      url: `${CIRCLE_BUILD_URL}`
    }
  }
}

const printTimestamp = () => {
  return {
    type: 'context',
    elements: [

      {
        type: 'mrkdwn',
        text: `*When*:  ${new Date().toLocaleString('en-US')}`
      },
      {
        type: 'mrkdwn',
        text: `*Why:*  Tests owned by this team`
      }
    ]
  }
}


const printFailedJobTemplate = ({ CIRCLE_PROJECT_REPONAME, CIRCLE_JOB, CIRCLE_BUILD_URL, CIRCLE_BUILD_NUM, CIRCLE_SHA1, CIRCLE_NODE_INDEX = 0 }) => [
  printHeader(1), // any non-zero number to indicate ci job has failed tests
  printTimestamp(),
  printProjectRepo({ CIRCLE_PROJECT_REPONAME, CIRCLE_JOB, CIRCLE_BUILD_URL, CIRCLE_SHA1 }),
  // printJobLink({ CIRCLE_BUILD_URL, CIRCLE_BUILD_NUM, CIRCLE_NODE_INDEX }),
]

const printSucceededJobTemplate = ({ CIRCLE_JOB, CIRCLE_PROJECT_REPONAME, CIRCLE_BUILD_URL, CIRCLE_BUILD_NUM, CIRCLE_SHA1, CIRCLE_NODE_INDEX = 0 }) => [
  printHeader(0),
  printTimestamp(),
  printProjectRepo({ CIRCLE_PROJECT_REPONAME, CIRCLE_JOB, CIRCLE_BUILD_URL, CIRCLE_SHA1 }),
  // printJobLink({ CIRCLE_BUILD_URL, CIRCLE_BUILD_NUM, CIRCLE_NODE_INDEX })
]


module.exports = { printFailedJobTemplate, printSucceededJobTemplate }
