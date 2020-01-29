const { screenshotDir } = require('../utils/integration-config')


const defaultTimeout = 5 * 60 * 1000

const withGlobalJestPuppeteerContext = test => async () => await test({ context, page: await context.newPage() })

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

const registerTest = ({ name, fn, timeout = defaultTimeout }) => test.concurrent(name, withGlobalJestPuppeteerContext(withScreenshot(name, fn)), timeout)

module.exports = { registerTest }
