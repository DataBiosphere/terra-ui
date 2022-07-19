const PuppeteerEnvironment = require('jest-environment-puppeteer')
const { maybeSaveScreenshot, savePageContent } = require('./utils/integration-utils')
const { parse } = require('path')
//const { send } = require('./services/slack')
const slack = require('./services/slack-post-message')
const slackChannels = require('./services/slack-notify-channels')
const { failed } = require('./services/slack-templates')
const _ = require('lodash/fp')


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

    if (name === 'test_done') {
      if (!!process.env.CI) { // Post a message to Slack channel when running tests has failed in CircleCI
       // await this.postSlackWhenFail(this.testName)
      }
    }

    if (super.handleTestEvent) {
      await super.handleTestEvent(event, state)
    }
  }

  async postSlackWhenFail(testName) {
    if (this.isSuccess) { // TODO change to !
      // await send()

      const getIds = _.flow(
        _.get('tests'),
        _.find(testName),
        _.get(testName),
        _.groupBy('id'),
        _.keys
      )
      const ids = getIds(slackChannels)
      // console.log(ids) // array object. e.g: [ 'C03ESC8SRPB', 'C7H40L71D' ]
      await Promise.all(
        _.forEach(async id => {
          // console.log(`send to id: ${id}`)
          await slack.postMessage(id, { blocks: failed(_.merge({
              TEST_NAME: this.testName,
              CIRCLE_BUILD_URL: 'https://circleci.com/gh/DataBiosphere/terra-ui/47116'},
              process.env.ENVIRONMENT)) })
        }, ids)
      )
    }
  }
}

module.exports = JestCircusEnvironment
