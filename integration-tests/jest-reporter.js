const { createWriteStream, existsSync, mkdirSync } = require('fs')
const path = require('path')


module.exports = class JestReporter {
  constructor(_globalConfig, _options) {
    this.logRootDir = process.env.LOG_DIR || '/tmp/test-results'
  }

  onTestStart(test) {
    console.info(`\n**  Running ${path.parse(test.path).name} at ${this.timeNow()}\n`)
  }

  onTestResult(_testRunConfig, testResult, _runResults) {
    const testName = path.parse(testResult.testFilePath).name
    const hasFailure = testResult.testResults.some(result => result.status === 'failed')
    const logDir = hasFailure ? `${this.logRootDir}/failures` : `${this.logRootDir}/successes`
    const logFileName = `${logDir}/${testName}-${Date.now()}.log`
    !existsSync(logDir) && mkdirSync(logDir, { recursive: true })

    const writableStream = createWriteStream(logFileName)
    writableStream.on('error', error => {
      console.error(`Error occurred while writing Console logs to ${logFileName}.\n${error.message}`)
    })

    if (testResult.console && testResult.console.length > 0) {
      testResult.console.forEach(log => {
        writableStream.write(`${log.message}\n`)
      })
    }

    // Write pass/failure summaries
    writableStream.write('\n\nTests Summary\n')
    testResult.testResults.forEach(result => {
      writableStream.write('----------------------------------------------\n')
      writableStream.write(`Test: ${result.title}\n`)
      writableStream.write(`Status: ${result.status}\n`)
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
  }

  timeNow() {
    return new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false
    })
  }
}
