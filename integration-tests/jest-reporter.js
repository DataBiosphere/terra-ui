const _ = require('lodash/fp')
const { parse } = require('path')
const { createWriteStream, existsSync, mkdirSync } = require('fs')


module.exports = class JestReporter {
  constructor(_globalConfig, _options) {
    this.logRootDir = process.env.LOG_DIR || '/tmp/test-results'
  }

  onTestStart(test) {
    const { path } = test
    console.info(`**  Running ${parse(path).name} at ${this.timeNow()}`)
  }

  onTestResult(_testRunConfig, testResult, _runResults) {
    const { testFilePath, testResults } = testResult
    const { name: testName } = parse(testFilePath)
    const hasFailure = _.some(({ status }) => status === 'failed', testResults)
    const logDir = `${this.logRootDir}/${hasFailure ? 'failures' : 'successes'}`
    const logFileName = `${logDir}/${testName}-${Date.now()}.log`

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

    _.forEach(({ message }) => writableStream.write(`${message}\n`), testResult.console)

    // Write pass/failure summaries
    writableStream.write('\n\nTests Summary\n')
    _.forEach(result => {
      writableStream.write('----------------------------------------------\n')
      writableStream.write(`Test: ${result.title}\n`)
      writableStream.write(`Status: ${result.status}\n`)
      const { failureMessages = [] } = result
      !_.isEmpty(failureMessages) && writableStream.write(`Failure message: ${failureMessages}\n`)
      writableStream.write('\n')
    }, testResults)

    writableStream.end()
    writableStream.on('finish', () => console.log(`Finished writing logs to ${logFileName}`))
  }

  timeNow() {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false
    })
  }
}
