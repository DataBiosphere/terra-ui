const { createWriteStream, existsSync, mkdirSync } = require('fs')
const path = require('path')


module.exports = class JestReporter {
  constructor(_globalConfig, _options) {
    this.logDir = process.env.SCREENSHOT_DIR || 'failures'
  }

  onTestStart(test) {
    console.info(`\n**  Running ${path.parse(test.path).name} at ${this.timeNow()}\n`)
  }

  onTestResult(_testRunConfig, testResult, _runResults) {
    console.log({ testResult })
    // Save log if a test has failed. Ignore test that has passed.
    const testName = path.parse(testResult.testFilePath).name
    const logFileName = `${this.logDir}/${testName}.log`
    !existsSync(this.logDir) && mkdirSync(this.logDir)

    const writableStream = createWriteStream(logFileName)
    writableStream.on('error', error => {
      console.error(`Error occurred while writing Console logs to ${logFileName}.\n${error.message}`)
    })

    if (testResult.console && testResult.console.length > 0) {
      testResult.console.forEach(log => {
        writableStream.write(`${log.message}\n`)
      })
    }

    // Get failure messages.
    writableStream.write('\n\nTests Summary\n')
    testResult.testResults.forEach(result => {
      writableStream.write('----------------------------------------------\n')
      writableStream.write(`Test: ${result.title}\n`)
      writableStream.write(`Status: ${result.status}\n`)
      // Get failure message.
      if (result.failureMessages.length > 0) {
        const failure = result.failureMessages
        writableStream.write(`Failure message: ${failure}\n`)
      }
      writableStream.write('\n')
    })

    writableStream.end()
    writableStream.on('finish', () => {
      console.log(`Finished writing logs to ${logFileName}`)
    })
    console.log(`saved tet log ${logFileName}`)
  }

  timeNow() {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false
    })
  }
}
