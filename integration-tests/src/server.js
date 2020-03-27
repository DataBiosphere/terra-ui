const _ = require('lodash/fp')
const express = require('express')
const http = require('http')
const { promiseHandler, Response, withAuth, withPuppeteer } = require('./utils')
const { testFindWorkflow } = require('../tests/find-workflow')
const { testImportCohortData } = require('../tests/import-cohort-data')
const { testImportDockstoreWorkflow } = require('../tests/import-dockstore-workflow')
const { testRegisterUser } = require('../tests/register-user')
const { testRunNotebook } = require('../tests/run-notebook')
const { testRunWorkflow } = require('../tests/run-workflow')
const { defaultTimeout } = require('../utils/integration-helpers')
const { delay, withScreenshot } = require('../utils/integration-utils')
const envs = require('../utils/terra-envs')


// Sane-ish max runtime for a test (20 minutes plus an extra minute for tear-down). Mainly to extend the default 2-minute timeout.
const serverTimeout = 21 * 60 * 1000

const app = express()
const server = http.createServer(app)
server.setTimeout(serverTimeout)

const testTimeout = async timeout => {
  await delay(timeout)
  throw new Error(`Test timeout after ${timeout}ms`)
}

const runTest = fn => withPuppeteer(async ({ browser, context, name, page, req, timeout }) => {
  const targetEnvParams = { ...envs[req.query.targetEnv] }
  try {
    const test = withScreenshot(name, fn)
    const result = await Promise.race([
      test({ browser, context, page, ...targetEnvParams }),
      testTimeout(timeout)
    ])
    return new Response(200, result)
  } catch (e) {
    return new Response(200, {
      name: e.name,
      message: e.message,
      stack: e.stack
    })
  }
})

const registerTestEndpoint = ({ fn, name, timeout = defaultTimeout }) => {
  if (timeout > serverTimeout) {
    console.warn(`${name}: timeout of ${timeout} is greater than the server timeout of ${serverTimeout}`)
  }
  const path = `/test/${name}`
  console.info(`=> ${path}`)
  app.post(path, promiseHandler(withAuth(async req => await runTest(fn)({ name, req, timeout }))))
}

_.forEach(registerTestEndpoint, [
  testFindWorkflow,
  testImportCohortData,
  testImportDockstoreWorkflow,
  testRegisterUser,
  testRunNotebook,
  testRunWorkflow
])
console.info('Ready')

server.listen(process.env.PORT || 8080)
