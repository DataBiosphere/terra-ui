const _ = require('lodash/fp')
const Sequencer = require('@jest/test-sequencer').default


// Start these tests first since they are long-running.
// This is most relevant on CI, where the number of simultaneous tests is capped.
const testsToRunFirst = [
  'create-interactive-analysis',
  'run-workflow',
  'run-workflow-on-snapshot'
]

class CustomSequencer extends Sequencer {
  sort(tests) {
    return _.sortBy(test => {
      const testName = _.flow(_.split('/'), _.last, _.replace(/\.js$/, ''))(test.path)
      return [
        !_.includes(testName, testsToRunFirst),
        testName
      ]
    }, tests)
  }
}

module.exports = CustomSequencer
