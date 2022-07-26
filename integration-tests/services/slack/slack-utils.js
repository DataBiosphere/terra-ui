const fs = require('fs')
const _ = require('lodash/fp')
const { printFailedJobTemplate, printSucceededJobTemplate } = require('./message-templates')
const { postMessage } = require('./post-message')


const saveJsonToFile = jsonStr => {
  const logDir = process.env.LOG_DIR || '/tmp/test-results'
  const fileName = `${logDir}/failed-tests-${process.env.CIRCLE_NODE_INDEX}.json`
  try {
    fs.writeFileSync(fileName, jsonStr, { encoding: "utf8" })
    console.log(`Saved JSON file: ${fileName}`)
  } catch (e) {
    console.error(`An error occurred while writing JSON file: ${fileName}`)
    console.error(e)
  }
}

// Returns a map object of channel_ids to notify when CircleCI job has failed
const convertJsonToMap = () => {
  const idsMap = new Map()
  const data = JSON.parse(fs.readFileSync('./services/slack/notify-channels.json', 'utf8'))
  const { fail: channels } = data
  _.forEach(key => {
    const id = _.get(['id'], key)
    const { tests } = key
    const names = _.map(item => item.name, tests)
    // console.log('names:', names)
    idsMap.set(id, names)
  }, channels)
  return idsMap
}

// Returns array object of channel_ids to notify when CircleCI job has succeeded
const getChannelsNotifySuccess = () => {
  const idsMap = []
  const data = JSON.parse(fs.readFileSync('./services/slack/notify-channels.json', 'utf8'))
  const { pass: channels } = data
  _.forEach(key => idsMap.push(_.get(['id'], key)), channels)
  // console.log([...idsMap])
  return idsMap
}

/**
 * find all Slack channels that contains this test.
 * @returns {Promise<Map<any, any>>}
 */
const getChannelsForFailedTests = failedTestsArray => {
  const channels = convertJsonToMap()
  // console.log([...channels.entries()])

  // Construct a map object: key: channel_id, value: test_names array
  const idsMap = new Map()
  _.forEach( test => {
    const filtered = Array.from(channels.keys())
      .map(key => channels.get(key).includes(test) ? key : undefined)
      .filter(key => key)
    if (filtered.length === 0) {
      console.error(`Test ${test} failed but it was not found in notify-channels.json`)
    }
    _.forEach(k => {
      if (idsMap.has(k)) {
        idsMap.get(k).push(test)
      } else {
        idsMap.set(k, new Array(test))
      }
      // console.log('idsMap:',idsMap)
    }, filtered)
  }, failedTestsArray)
  // console.log(...idsMap)
  if (idsMap.size > 0) {
    saveJsonToFile(JSON.stringify([...idsMap]))
  }
  return idsMap
}


module.exports = { getChannelsNotifySuccess, getChannelsForFailedTests, saveJsonToFile }
