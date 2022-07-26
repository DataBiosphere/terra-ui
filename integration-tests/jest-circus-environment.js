const PuppeteerEnvironment = require('jest-environment-puppeteer')
const { maybeSaveScreenshot, savePageContent } = require('./utils/integration-utils')
const { parse } = require('path')
const slack = require('./services/slack/post-message')


class JestCircusEnvironment extends PuppeteerEnvironment {
  constructor(config, context) {
    super(config, context)
    this.testName = parse(context.testPath).name
    this.isSuccess = true
  }

  // Jest default test runner jest-circus.
  // https://github.com/facebook/jest/blob/main/packages/jest-circus/README.md#overview
  async handleTestEvent(event, state) {
    const { name } = event // `test_done` indicates that the test and all its hooks were run

    if (['hook_failure', 'test_fn_failure'].includes(name)) {
      this.isSuccess = false
      const [activePage] = (await this.global.browser.pages()).slice(-1)
      await maybeSaveScreenshot(activePage, this.testName)
      await savePageContent(activePage, this.testName)
    }

    /*
    if (name === 'test_done') {
      if (!!process.env.CI) {
        // Post a message to Slack channel when running tests has failed in CircleCI
        await slack.postSlackWhenFail(this.testName)
      }
    }
    */

    if (super.handleTestEvent) {
      await super.handleTestEvent(event, state)
    }
  }
}

module.exports = JestCircusEnvironment
