const _ = require('lodash/fp')
const config = require('../utils/integration-config')
const { defaultTimeout } = require('../utils/integration-helpers')
const envs = require('../utils/terra-envs')


const {
  BILLING_PROJECT: billingProject,
  ENVIRONMENT: environment = 'local',
  TEST_URL: testUrl
} = process.env

const targetEnvParams = _.merge({ ...envs[environment] }, { billingProject, testUrl })
console.info(targetEnvParams)

const withGlobalJestPuppeteerContext = fn => () => fn({ context, page })

const withGlobalConfig = fn => options => fn({ ...config, ...targetEnvParams, ...options })

const withScreenshot = (testName, fn) => async options => {
  const { page } = options
  try {
    await fn(options)
  } catch (e) {
    const { screenshotDir } = config
    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/failure-${Date.now()}-${testName}.png`, fullPage: true })
    }
    throw e
  }
}

const registerTest = ({ name, fn, timeout = defaultTimeout }) => test(name, withGlobalJestPuppeteerContext(withGlobalConfig(withScreenshot(name, fn))), timeout)

module.exports = { registerTest }
