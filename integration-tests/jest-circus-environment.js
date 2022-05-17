const PuppeteerEnvironment = require('jest-environment-puppeteer')
const { maybeSaveScreenshot } = require('./utils/integration-utils')
const { parse } = require('path')


class JestCircusEnvironment extends PuppeteerEnvironment {
  constructor(config, context) {
    super(config, context)
    this.testName = parse(context.testPath).name
  }

  // Jest default test runner jest-circus.
  // https://github.com/facebook/jest/blob/main/packages/jest-circus/README.md#overview
  async handleTestEvent(event, state) {
    const { name } = event
    if (['hook_failure', 'test_fn_failure'].includes(name)) {
      const [activePage] = (await this.global.browser.pages()).slice(-1)
      await maybeSaveScreenshot(activePage, this.testName)
    }
    if (super.handleTestEvent) {
      await super.handleTestEvent(event, state)
    }
  }
}

module.exports = JestCircusEnvironment
