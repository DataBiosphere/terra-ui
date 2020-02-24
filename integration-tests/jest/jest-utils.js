const config = require('../utils/integration-config')
const { defaultTimeout } = require('../utils/integration-helpers')


const withGlobalJestPuppeteerContext = fn => () => fn({ context, page })

const withGlobalConfig = fn => options => fn({ ...config, ...options })

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
