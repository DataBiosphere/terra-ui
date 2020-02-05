const { screenshotDir } = require('../utils/integration-config')
const { defaultTimeout } = require('../utils/integration-helpers')


const withGlobalJestPuppeteerContext = fn => () => fn({ context, page })

const withScreenshot = (testName, fn) => async ({ context, page }) => {
  try {
    await fn({ context, page })
  } catch (e) {
    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/failure-${Date.now()}-${testName}.png`, fullPage: true })
    }
    throw e
  }
}

const registerTest = ({ name, fn, timeout = defaultTimeout }) => test(name, withGlobalJestPuppeteerContext(withScreenshot(name, fn)), timeout)

module.exports = { registerTest }
