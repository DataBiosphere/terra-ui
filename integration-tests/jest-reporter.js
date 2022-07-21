const _ = require('lodash/fp')
const { parse } = require('path')
const { createWriteStream, mkdirSync, writeFileSync } = require('fs')
const slack = require('./services/slack/post-message')
const { failedJobTemplate } = require('./services/slack/templates')


module.exports = class JestReporter {
  constructor(_globalConfig, _options) {
    this.logRootDir = process.env.LOG_DIR || '/tmp/test-results'
    this.failedTests = []
  }

  timeNow() {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false
    })
  }

  onTestStart(test) {
    const { path } = test
    console.log(`**  Running ${parse(path).name} at ${this.timeNow()}`)
  }

  onTestResult(_testRunConfig, testResult, _runResults) {
    const { testFilePath, testResults } = testResult
    const { name: testName } = parse(testFilePath)
    const hasFailure = _.some(({ status }) => status === 'failed', testResults)
    const logDir = `${this.logRootDir}/${hasFailure ? 'failures' : 'successes'}`
    const logFileName = `${logDir}/${testName}-${Date.now()}.log`

    //const ret = _.filter(r => r.status === 'failed', testResults)
    //console.log('ret:', ret)
    //const title = _.forEach(item => { _.pick(['title'], item)}, ret)
    //console.log('title:', title)

    _.forEach( (obj) => {
      if (obj.status === 'failed') {
        this.failedTests.push(obj.title)
      }
    }, testResults )


    // Since Node 10, mkdirSync knows to not do anything if the dir exists (https://stackoverflow.com/a/71767385/2851999) so not checking explicitly
    // We may want to specify what to do if an error occurs. Not sure if throwing is what we'd want.
    try {
      mkdirSync(logDir, { recursive: true })
    } catch (err) {
      console.error(err)
      throw err
    }

    const writableStream = createWriteStream(logFileName)
    writableStream.on('error', ({ message }) => console.error(`Error occurred while writing Console logs to ${logFileName}.\n${message}`))

    _.forEach(({ message }) => { writableStream.write(`${message}\n`) }, testResult?.console)

    // Write pass/failure summaries
    writableStream.write('\n\nTests Summary\n')
    _.forEach(result => {
      const { title, status, failureMessages, failureDetails } = result
      writableStream.write('----------------------------------------------\n')
      writableStream.write(`Test: ${title}\n`)
      writableStream.write(`Status: ${status}\n`)
      if (!_.isEmpty(failureMessages)) {
        writableStream.write(`Failure messages: ${failureMessages}\n`)
      }
      if (!_.isEmpty(failureDetails)) {
        writableStream.write(`Failure details: ${JSON.stringify(failureDetails, null, 2)}\n`)
      }
      writableStream.write('\n')
    }, testResults)

    writableStream.end()
    writableStream.on('finish', () => console.log(`**  Saved ${testName} results: ${logFileName}`))
  }

  printFailedTestHelper(result) {
    const blocks = []
    if (result.status === 'failed') {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `- ${result.title}`
        }
      })
    }
    return blocks
  }

  printFailedTests(results) {
    const { testResults } = results
    const blocks = []
    _.forEach(suite => blocks.push(...suite.testResults.flatMap(this.printFailedTestHelper)), testResults)
    return blocks
  }

  // Called after all tests have completed
  async onRunComplete(test, runResults) {
    // Save run summary to a file.
    const summaryFile = `tests-summary.json`
    writeFileSync(`${this.logRootDir}/${summaryFile}`, JSON.stringify(runResults, null, 2))
    console.log(`**  Saved all tests summary: ${this.logRootDir}/${summaryFile}`)

    // Added
    if (!!process.env.CI) {



      // Post a message to Slack channel when running tests has failed in CircleCI
      const blocks =
        failedJobTemplate(
          _.merge({
            // mocked
            CIRCLE_PROJECT_REPONAME: 'terra-ui',
            CIRCLE_JOB: 'integration-tests-staging',
            CIRCLE_BUILD_URL: 'https://circleci.com/gh/DataBiosphere/terra-ui/47116'
          }, process.env)
        )

      console.log('blocks:', blocks)
      console.log('END')

      const testBlocks = this.printFailedTests(runResults)
      console.log('testBlocks:', testBlocks)
      console.log('END')

      const mergedBlocks = blocks.concat(testBlocks)
      console.log('mergedBlocks:', mergedBlocks)

      _.forEach(async test => {
        const channels = slack.getChannelIDs(test)
        await Promise.all(
          _.forEach(async channel => {
            await slack.postMessage({
              channel: channel,
              blocks: mergedBlocks
            })
          }, channels)
        )
      }, this.failedTests)


    }

    const { numFailedTests } = runResults

    if (numFailedTests >= 0) {
      const { testResults } = runResults
      // console.log('testResults:', testResults)

      const obj = _.filter(({ testResults: result }) => {
        //console.log('result:', result)
        return _.find(r => r.status === 'passed', result)
      }, testResults)
      //console.log('obj:', obj)
      // console.log(_.get(['testFilePath'], obj))
      //console.log(`testFilePath:\n${JSON.stringify(testFilePath(testResults), null, 2)}`)
    }
  }

}
