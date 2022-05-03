const _ = require('lodash/fp')
const { parse } = require('path')
const { createWriteStream, existsSync, mkdirSync } = require('fs')


module.exports = class JestReporter {
  constructor(_globalConfig, _options) {
    this.logRootDir = process.env.LOG_DIR || '/tmp/test-results'
  }

  onTestStart(test) {
    const { path } = test
    console.info(`\n**  Running ${parse(path).name} at ${this.timeNow()}\n`)
  }

  onTestResult(_testRunConfig, testResult, _runResults) {
    const { testFilePath, testResults } = testResult
    const { name: testName } = parse(testFilePath)
    const hasFailure = _.some(({ status }) => status === 'failed', testResults)
    const logDir = `${this.logRootDir}/${hasFailure ? 'failures' : 'successes'}`
    const logFileName = `${logDir}/${testName}-${Date.now()}.log`
    !existsSync(logDir) && mkdirSync(logDir, { recursive: true })

    const writableStream = createWriteStream(logFileName)
    writableStream.on('error', ({ message }) => {
      console.error(`Error occurred while writing Console logs to ${logFileName}.\n${message}`)
    })

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
    writableStream.on('finish', () => {
      console.log(`Finished writing logs to ${logFileName}`)
    })
  }

  timeNow() {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false
    })
  }
}
