const _ = require('lodash/fp');
const { getFailedTestNamesFromArtifacts } = require('./circleci-utils');
const { getMessageBlockTemplate } = require('./message-templates');
const { postMessage } = require('./post-message');
const testsInfo = require('./slack-notify-channels.json');

/**
 * Get array of Slack channel IDs for succeeded job notification
 * @returns {Array[string]}
 */
const getAllSlackChannelsForPassedJob = () => {
  return _.map('id', testsInfo.pass);
};

/**
 * Get all Slack channel IDs and test names for failed job notification
 * @returns {Map<string, Array[string]>}
 */
const getAllSlackChannelsForFailedJob = () => {
  const allChannelsAndTests = new Map();
  _.forEach((item) => {
    const channelId = _.get('id', item);
    const testNames = _.map((test) => test.name, item.tests);
    allChannelsAndTests.set(channelId, testNames);
  }, testsInfo.fail);
  return allChannelsAndTests;
};

/**
 * Get a map object of Slack channel IDs and array of test names for failed tests notification
 * @param {Array[string]} failedTests
 * @returns {Map<string, Array[string]>} A map object where key is channel_id, value is test_names array
 */
const getFailedTestsAndChannelIDs = (failedTests) => {
  const allChannelsAndTests = getAllSlackChannelsForFailedJob();

  const filteredIncludeOnlyFailedTests = new Map(); // Map<string, Array[string]>
  _.forEach((test) => {
    const channelIdsForFailedTest = Array.from(allChannelsAndTests.keys()).filter(
      (key) => allChannelsAndTests.get(key).includes(test) || allChannelsAndTests.get(key).length === 0
    ); // A channel without a list of tests means notify that channel for any failing test
    _.forEach((channelId) => {
      if (!filteredIncludeOnlyFailedTests.has(channelId)) {
        filteredIncludeOnlyFailedTests.set(channelId, []);
      }
      filteredIncludeOnlyFailedTests.get(channelId).push(test);
    }, channelIdsForFailedTest);
  }, failedTests);

  return filteredIncludeOnlyFailedTests;
};

// Post CircleCI UI test report to Slack channels
const notifyCircleCITestResults = async () => {
  const failedTestNames = await getFailedTestNamesFromArtifacts();

  if (failedTestNames.length === 0) {
    // Slack notification: CircleCI job succeeded
    const channelIDs = getAllSlackChannelsForPassedJob();
    const messageBlocks = getMessageBlockTemplate(failedTestNames);
    // Using _.forEach to post same message to each Slack channels separately because a Slack issue: No way to post the same message to multiple channels at once.
    // See: https://github.com/slackapi/bolt-js/issues/696
    return _.forEach(async (channelId) => await postMessage({ channel: channelId, blocks: messageBlocks }), channelIDs);
  }

  // Slack notification: CircleCI job failed. Message contains list of failed test names.
  const channelIDsAndNames = getFailedTestsAndChannelIDs(failedTestNames);
  _.forEach(async ([channelId, testNames]) => {
    const messageBlocks = getMessageBlockTemplate(testNames);
    await postMessage({ channel: channelId, blocks: messageBlocks });
  }, _.toPairs(channelIDsAndNames));
};

(async () => {
  await notifyCircleCITestResults();
})();
