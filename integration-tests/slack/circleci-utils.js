const _ = require('lodash/fp');
const fetch = require('node-fetch');
const { parse } = require('path');

const checkStatus = (response) => {
  if (response.ok) {
    return response;
  }
  throw new Error(`HTTP error response status: ${response.status} ${response.statusText}`);
};

/**
 * Fetch CircleCI artifact links to tests summary JSON files (created in onRunComplete() in jest-reporter.js)
 * @param {string} token
 * @param {string} buildNum
 * @returns {Promise<Array[string]>} URL to tests-summary-[0-9].json
 */
const fetchJobArtifacts = async ({ buildNum = process.env.CIRCLE_BUILD_NUM } = {}) => {
  if (!buildNum) {
    throw new Error('**  ERROR: Missing CircleCI build number. Failed to fetch CircleCI job artifacts.');
  }

  const apiUrlRoot = 'https://circleci.com/api/v1.1/project/github/DataBiosphere/terra-ui';
  try {
    // Because terra-ui is a public repository on GitHub, API token is not required. See: https://circleci.com/docs/oss#security
    const response = await fetch(`${apiUrlRoot}/${buildNum}/artifacts`);
    checkStatus(response);

    const items = await response.json();
    const testSummaryArtifacts = _.filter(_.flow(_.get('path'), _.includes('tests-summary')), items);
    return _.map('url', testSummaryArtifacts);
  } catch (error) {
    console.error(`** ERROR fetching CircleCI JOB_BUILD_NUM: ${buildNum} artifacts.`);
    console.error(error);
    throw error;
  }
};

/**
 *
 * @param {@link https://github.com/facebook/jest/blob/240587bde5dae1467ced0fdeee2e668e01caf896/packages/jest-test-result/src/types.ts#L77 AggregatedResult} Results from the test run.
 * @returns {Array[string]}
 */
const getFailedTestNames = (aggregatedResults) => {
  return _.flow(
    _.filter((testResult) => testResult.numFailingTests > 0),
    _.map((testResult) => parse(testResult.testFilePath).name)
  )(aggregatedResults.testResults);
};

/**
 * Parse all tests-summary JSON to look for failed test names
 * @returns {Promise<Array[string]>}
 */
const getFailedTestNamesFromArtifacts = async () => {
  const urls = await fetchJobArtifacts();
  console.log(`Build artifacts URLs: \n${urls.map((url) => `* ${url}`).join('\n')}\n`);
  return _.flatten(
    await Promise.all(
      _.map(async (url) => {
        try {
          const response = await fetch(url);
          return getFailedTestNames(await response.json());
        } catch (e) {
          console.error(`**  ERROR: Encountered error when getting CircleCI artifacts tests-summary.json: ${url}.`, e);
          throw e;
        }
      }, urls)
    )
  );
};

module.exports = {
  getFailedTestNamesFromArtifacts,
};
