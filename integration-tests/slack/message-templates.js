const { CIRCLE_JOB, CIRCLE_BUILD_NUM, CIRCLE_SHA1 } = process.env;

const getHeaderBlock = (numFailedTests) => {
  if (numFailedTests === 0) {
    return {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':circleci-pass:  Terra-UI Test has Passed on CircleCI',
      },
    };
  }

  return {
    type: 'header',
    text: {
      type: 'plain_text',
      text: ':circleci-fail:  Terra-UI Test has Failed on CircleCI',
    },
  };
};

const getJobDetailBlock = () => ({
  type: 'section',
  fields: [
    {
      type: 'mrkdwn',
      text: `*Job ${CIRCLE_BUILD_NUM}*: <https://circleci.com/gh/DataBiosphere/terra-ui/${CIRCLE_BUILD_NUM} | ${CIRCLE_JOB}>`,
    },
    {
      type: 'mrkdwn',
      text: `*Commit*: <https://github.com/DataBiosphere/terra-ui/commit/${CIRCLE_SHA1} | ${`${CIRCLE_SHA1}`.slice(0, 7)}>`,
    },
  ],
});

const getTestsListBlock = (testNames) => ({
  type: 'section',
  fields: [
    {
      type: 'mrkdwn',
      text: `*  ${testNames.join('\n*  ')}`,
    },
  ],
});

const getMessageBlockTemplate = (failedTestNames) => {
  const size = failedTestNames.length;

  const blocksArray = [getHeaderBlock(size), getJobDetailBlock()];

  return size === 0 ? blocksArray : blocksArray.concat(getTestsListBlock(failedTestNames));
};

module.exports = { getMessageBlockTemplate };
