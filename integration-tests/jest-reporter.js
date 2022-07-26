const _ = require('lodash/fp')
const { parse } = require('path')
const { createWriteStream, mkdirSync, writeFileSync } = require('fs')
const slack = require('./services/slack/post-message')
const { printFailedJobTemplate, printSucceededJobTemplate } = require('./services/slack/message-templates')
const { getChannelsForFailedTests, getChannelsNotifySuccess, saveJsonToFile } = require('./services/slack/slack-utils')


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

    /*// Since Node 10, mkdirSync knows to not do anything if the dir exists (https://stackoverflow.com/a/71767385/2851999) so not checking explicitly
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
     */
    // Added
    if (hasFailure) {
      this.failedTests.push(testName)
      saveJsonToFile(JSON.stringify([...this.failedTests]))
    }
  }

  printTestText(testNameArray) {
    const blocks = []
    _.forEach(name => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `- ${name}`
        }
      })
    }, testNameArray)
    console.log('blocks:', blocks)
    return blocks
  }

  printAllTestText(mapObj) {
    const blocks = []

    _.forEach(([key, value]) => {
      console.log('value:', value)
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `- ${value}`
        }
      })
    }, _.entries(mapObj))

    console.log('blocks:', blocks)
    return blocks
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
    const summaryFile = `tests-summary${process.env.CIRCLE_NODE_INDEX ? `-${process.env.CIRCLE_NODE_INDEX}` : ''}.json`
    writeFileSync(`${this.logRootDir}/${summaryFile}`, JSON.stringify(runResults, null, 2))
    // console.log(`**  Saved all tests summary: ${this.logRootDir}/${summaryFile}`)

    // Added
    if (!process.env.CI || process.env.CIRCLE_BRANCH !== 'dev') {
      console.log('return early')
      return
    }

    const mock = {
      CIRCLE_PROJECT_REPONAME: 'terra-ui',
      CIRCLE_BRANCH: 'dev',
      CIRCLE_JOB: 'integration-tests-staging',
      CIRCLE_BUILD_URL: 'https://circleci.com/gh/DataBiosphere/terra-ui/47116',
      CIRCLE_BUILD_NUM: '47116',
      CIRCLE_NODE_INDEX: 0,
      CIRCLE_SHA1: '4b4aae6d835030eb1c1a69ad770776aca07ea39e'
    }

    const { numFailedTests } = runResults
    if (numFailedTests === 0) {
      // notify success
      const blocks = printSucceededJobTemplate(_.merge(mock, process.env))
      // console.log('\n%s\n', JSON.stringify(blocks))
      const channels = getChannelsNotifySuccess()
      _.forEach(async channel => await slack.postMessage({ channel, blocks }), channels)
      return
    }

    // Post a message to every Slack channel
    const channelAndTestsMap = getChannelsForFailedTests(this.failedTests)
    console.log('channelAndTestsMap:', channelAndTestsMap)
    _.forEach(async ([k, v]) => {
      // key is channel_id. value is names array.
      const blocks = printFailedJobTemplate(_.merge(mock, process.env))
      blocks.push({
        type: 'section',
        fields:
            [
              {
                type: 'mrkdwn',
                text: `:fail2:  Test Suites:\n\`\`\`*  ${v.join('\n*  ')}\`\`\``
              }
            ]
      })
      console.log('\n%s\n', JSON.stringify(blocks))
      await slack.postMessage({ channel: k, blocks })
    }, _.entries(channelAndTestsMap))





    //console.log('blocks:', blocks)
    //console.log('END')

    // const testBlocks = this.printFailedTests(runResults)
    //console.log('testBlocks:', testBlocks)
    //console.log('END')

    // const mergedBlocks = blocks.concat(testBlocks)
    //console.log('mergedBlocks:', mergedBlocks)

    /*
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
     */

    /*
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
     */
  }
}
