const _ = require('lodash/fp')
const { defaultTimeout } = require('../utils/integration-helpers')
const { withScreenshot, withPageLogging } = require('../utils/integration-utils')
const { Cluster } = require('puppeteer-cluster')
const envs = require('../utils/terra-envs')
const rawConsole = require('console')
const { mkdirSync, existsSync, createWriteStream } = require('fs')


const {
  BILLING_PROJECT: billingProject,
  ENVIRONMENT: environment = 'local',
  SNAPSHOT_COLUMN_NAME: snapshotColumnName,
  SNAPSHOT_ID: snapshotId,
  SNAPSHOT_TABLE_NAME: snapshotTableName,
  TEST_URL: testUrl,
  WORKFLOW_NAME: workflowName = 'echo_to_file',
  FLAKES: flakes = false,
  RUNS: testRuns = 100,
  CONCURRENCY: maxConcurrency = 10,
  // Most tests should not take this long to complete even when running 100 times
  // But we want to give this tool enough time to run without a jest timeout
  CLUSTER_TIMEOUT_MINUTES: clusterTimeout = 120
} = process.env

const targetEnvParams = _.merge({ ...envs[environment] }, { billingProject, snapshotColumnName, snapshotId, snapshotTableName, testUrl, workflowName })

const registerTest = ({ fn, name, timeout = defaultTimeout, targetEnvironments = _.keys(envs) }) => {
  return _.includes(environment, targetEnvironments) ? test(
    name,
    () => withPageLogging(withScreenshot(name)(fn))({ context, page, ...targetEnvParams }),
    timeout
  ) : test(
    name,
    () => console.log(`Skipping ${name} as it is not configured to run on the ${environment} environment`),
    timeout)
}

const logTestProgress = (defaultOutputStream, { total, completed, errored, errorMap, linesWritten = -1 }) => {
  if (completed > 1) {
    defaultOutputStream.moveCursor(0, linesWritten * -1)
    defaultOutputStream.clearLine(1)
  }

  let newLinesWritten = 2
  defaultOutputStream.write(`Running tests: ${Math.floor(completed * 100.0 / total)}% (deleted the last ${linesWritten} lines)`)

  if (!!errored) {
    _.forEach(key => {
      const stackLines = key.split('\n')
      newLinesWritten += stackLines.length + 2
      defaultOutputStream.write(`\n\t\x1b[31m\x1b[1mError encountered ${errorMap[key]} times`)
      defaultOutputStream.write(`\n\t\x1b[0m${stackLines.join('\n\t')}\n\n`)
    }, _.keys(errorMap))
  }

  return newLinesWritten
}

const flakeShaker = ({ fn, name }) => {
  const resultsDir = './results'
  const screenshotDir = `${resultsDir}/screenshots`
  const logsDir = `${resultsDir}/logs`
  const timeoutMillis = clusterTimeout * 60 * 1000
  const padding = 100
  const messages = ['', `Number of times to run this test: ${testRuns} (adjust this by setting RUNS in your environment)`,
    '',
    `Number of concurrent test runs: ${maxConcurrency} (adjust this by setting CONCURRENCY in your environment)`,
    '',
    `Timeout (minutes): ${clusterTimeout} (if your test times out adjust CLUSTER_TIMEOUT_MINUTES in your environment)`,
    '']

  rawConsole.log(`\n\x1b[1m${/* bold */ '╔'.padEnd(padding, '═')}╗`)
  rawConsole.log(`${`║ Running flake shaker on ${name} to flush out test flakiness...`.padEnd(padding)}║`)
  rawConsole.log(`${'╚'.padEnd(padding, '═')}╝`)

  const message = _.flow(
    _.map(line => `${`║ ${line}`.padEnd(padding)}║\n`),
    list => [...list, `${'╚'.padEnd(padding, '═')}╝`],
    _.join(''))(messages)
  rawConsole.log(`${message}`)

  !existsSync(resultsDir) && mkdirSync(resultsDir)
  !existsSync(screenshotDir) && mkdirSync(screenshotDir)
  !existsSync(logsDir) && mkdirSync(logsDir)

  const runCluster = async () => {
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: _.toInteger(maxConcurrency),
      timeout: timeoutMillis,
      puppeteerOptions: {
        defaultViewport: { width: 1200, height: 800 }
      }
    })

    const defaultOutputStream = _.clone(process.stdout)
    const newOutputStream = createWriteStream(`${logsDir}/log`)
    process.stdout.write = newOutputStream.write.bind(newOutputStream)
    defaultOutputStream.write(`Running tests: 0%`)

    const testProgress = {
      completed: 0,
      errored: 0,
      errorMap: {},
      total: testRuns,
      linesWritten: 0
    }

    await cluster.task(async ({ page, data }) => {
      const { taskFn, taskParams, runId } = data
      try {
        const result = await taskFn({ context, page, ...taskParams })
        return result
      } catch (e) {
        await page.screenshot({ path: `${screenshotDir}/${runId}.jpg`, fullPage: true })
        testProgress.errored++
        testProgress.errorMap[e.stack] = _.has(e.stack, testProgress.errorMap) ? testProgress.errorMap[e.stack] + 1 : 1
        return e
      } finally {
        testProgress.completed++
        testProgress.linesWritten = logTestProgress(defaultOutputStream, testProgress)
      }
    })

    const runs = _.times(runId => cluster.execute({ taskParams: targetEnvParams, taskFn: fn, runId }), testRuns)
    await Promise.all(runs)
    process.stdout.write = defaultOutputStream

    await cluster.idle()
    await cluster.close()

    rawConsole.log(`Log is available at ./${logsDir}, and screenshots are available at ./${screenshotDir}`)
    if (!!testProgress.numErrors) {
      throw new Error(`${testProgress.numErrors} failures out of ${testRuns}. See below for specifics.`)
    }
  }

  return test(name, runCluster, timeoutMillis)
}

module.exports = { registerTest: flakes ? flakeShaker : registerTest }
