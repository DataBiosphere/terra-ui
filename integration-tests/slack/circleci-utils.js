const _ = require('lodash/fp')
const fetch = require('node-fetch')
const { parse } = require('path')


/**
 * Fetch CircleCI artifact links to tests summary JSON files (were created in onRunComplete() in jest-reporter.js)
 * @param { string } token
 * @param { string } buildNum
 * @returns { Promise<Array[string]> } URL to tests-summary-[0-9].json
 */
const fetchJobArtifacts = async ({ buildNum = process.env.CIRCLE_BUILD_NUM } = {}) => {
  if (!buildNum) {
    throw new Error(`**  ERROR: Missing CircleCI build number. Failed to fetch CircleCI job artifacts.`)
  }

  // For more arguments and details of the response, see: https://circleci.com/docs/api/v2/index.html#operation/getJobArtifacts
  const apiUrlRoot = 'https://circleci.com/api/v2/project/github/DataBiosphere/terra-ui'
  try {
    // Because terra-ui is a public repository on GitHub, API token is not required. See: https://circleci.com/docs/oss#security
    const response = await fetch(`${apiUrlRoot}/${buildNum}/artifacts`)
    const { items } = await response.json()
    const testSummaryArtifacts = _.filter(_.flow(_.get('path'), _.includes('tests-summary')), items)
    return _.map(_.get('url'), testSummaryArtifacts)
  } catch (e) {
    console.error(`**  ERROR: Encountered error when getting CircleCI JOB_BUILD_NUM: ${buildNum} artifacts.`, e)
    throw e
  }
}

/**
 *
 * @param { string } aggregatedResults A JSON object
 * @returns { Array[string] }
 */
const getFailedTestNames = aggregatedResults => {
  return _.flow(
    _.filter(testResult => testResult.numFailingTests > 0),
    _.map(testResult => parse(testResult.testFilePath).name)
  )(aggregatedResults.testResults)
}

/**
 *
 * @returns { Promise<Array[string]> }
 */
const getFailedTestNamesFromArtifacts = async () => {
  const tests = []
  // Parse all tests-summary JSON to look for failed test names
  const urls = await fetchJobArtifacts()
  await Promise.all(_.map(async url => {
    try {
      const response = await fetch(url)
      const failedTests = getFailedTestNames(await response.json())
      tests.push(...failedTests)
    } catch (e) {
      console.error(`**  ERROR: Encountered error when getting CircleCI artifacts tests-summary.json: ${url}.`, e)
      throw e
    }
  }, urls))

  return tests
}

module.exports = {
  getFailedTestNamesFromArtifacts
}
