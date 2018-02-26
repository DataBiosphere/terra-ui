import _ from 'underscore'
import update from 'immutability-helper'


let allPathHandlers = {}

const defPath = function(k, handler) {
  console.assert(_.has(handler, 'regex'))
  console.assert(_.has(handler, 'component'))
  console.assert(_.has(handler, 'makeProps'))
  console.assert(_.has(handler, 'makePath'))

  console.assert(!_.has(allPathHandlers, k), `Key ${k} is already defined`)

  allPathHandlers[k] = handler
}

let allRedirects = []

const defRedirect = function(handler) {
  console.assert(_.has(handler, 'regex'))
  console.assert(_.has(handler, 'makePath'))

  allRedirects.push(handler)
}

const clearPaths = function() {
  allPathHandlers = {}
  allRedirects = []
}

const findMatches = function(windowHash, checkingRedirects) {
  const workingHash = windowHash || ''
  const cleaned = decodeURI(workingHash.substring(1))

  return _.filter(
    _.map(
      checkingRedirects ? allRedirects : _.pairs(allPathHandlers),
      function(x) {
        const [k, handler] = checkingRedirects ? [null, x] : x
        if (handler.regex.test(cleaned)) {
          return update(handler, {
            key: { $set: k },
            makeProps: { $set: () => handler.makeProps.apply(_.rest(cleaned.match(handler.regex))) }
          })
        }
      }
    ),
    x => (x !== false)
  )
}

const findPathHandler = function(windowHash) {
  const matchingHandlers = findMatches(windowHash, false)
  console.assert(matchingHandlers.length <= 1,
    `Multiple handlers matched path: ${_.map(matchingHandlers, x => x)}`)
  return _.first(matchingHandlers)
}

const getPath = function(k, ...args) {
  const handler = allPathHandlers[k]
  console.assert(handler,
    `No handler found for key ${k}. Valid path keys are: ${_.allKeys(allPathHandlers)}`)
  return encodeURI(handler.makePath.apply(args))
}

const getLink = function(k, ...args) {
  return `#${getPath.apply(Array.from(arguments))}`
}

const goToPath = function(k, ...args) {
  window.location.hash = getPath.apply(Array.from(arguments))
}

const isCurrentPath = function(k, ...args) {
  return getPath.apply(Array.from(arguments))
}

const executeRedirects = function(windowHash) {
  const matchingHandlers = findMatches(windowHash, true)
  console.assert(matchingHandlers.length <= 1,
    `Multiple redirects for matched path: ${_.pluck(matchingHandlers, 'regex')}`)

  if (matchingHandlers[0]) {
    window.location.replace(`#${matchingHandlers[0].makePath()}`)
    return true
  }
}

export {
  defPath,
  defRedirect,
  clearPaths,
  findPathHandler,
  getPath,
  getLink,
  goToPath,
  isCurrentPath,
  executeRedirects
}
