const express = require('express')
const _ = require('lodash/fp')
const puppeteer = require('puppeteer')
const { promiseHandler, Response } = require('./utils')
const { testFindWorkflow } = require('../tests/find-workflow')
const { testImportCohortData } = require('../tests/import-cohort-data')
const { testImportDockstoreWorkflow } = require('../tests/import-dockstore-workflow')
const { testRegisterUser } = require('../tests/register-user')
const { testRunWorkflow } = require('../tests/run-workflow')
const { defaultTimeout } = require('../utils/integration-helpers')
const { delay, withScreenshot } = require('../utils/integration-utils')
const envs = require('../utils/terra-envs')


const app = express()

const getBrowser = _.once(() => puppeteer.launch())
const getContext = async () => {
  const browser = await getBrowser()
  return browser.createIncognitoBrowserContext()
}

const testTimeout = async (context, timeout) => {
  await delay(timeout)
  context.close()
  throw new Error(`Test timeout after ${timeout}ms`)
}

const registerTestEndpoint = ({ id, fn, timeout = defaultTimeout }) => {
  const path = `/test/${id}`
  console.info(`=> ${path}`)
  app.post(path, promiseHandler(async req => {
    const targetEnvParams = { ...envs[req.query.targetEnv] }
    const context = await getContext()
    const page = await context.newPage()
    try {
      const result = await Promise.race([
        withScreenshot(id)(fn)({ context, page, ...targetEnvParams }),
        testTimeout(context, timeout)
      ])
      return new Response(200, result)
    } catch (e) {
      return new Response(200, JSON.stringify({
        name: e.name,
        message: e.message,
        stack: e.stack
      }))
    }
  }))
}

_.forEach(registerTestEndpoint, [
  testFindWorkflow,
  testImportCohortData,
  testImportDockstoreWorkflow,
  testRegisterUser,
  testRunWorkflow
])
console.info('Ready')

app.listen(process.env.PORT || 8080)
