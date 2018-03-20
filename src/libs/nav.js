import _ from 'lodash'


let allPathHandlers = {}

/**
 * @param {string} k - key for path
 * @param {object} handler
 * @param {regex} handler.regex - regex with capture groups for props
 * @param {class} handler.component
 * @param {function} handler.makeProps - takes regex matches, returns props object
 * @param {function} handler.makePath - takes regex matches, returns string path to go after '#'
 */
export const defPath = function(k, handler) {
  console.assert(_.has(handler, 'regex'))
  console.assert(_.has(handler, 'component'))
  console.assert(_.has(handler, 'makeProps'))
  console.assert(_.has(handler, 'makePath'))

  console.assert(!_.has(allPathHandlers, k), `Key ${k} is already defined`)

  allPathHandlers[k] = handler
}

let allRedirects = []

/**
 * @param {regex} handler.regex - regex with capture groups for props
 * @param {function} handler.makePath - takes regex matches, returns string path to go after '#'
 */
export const defRedirect = function(handler) {
  console.assert(_.has(handler, 'regex'))
  console.assert(_.has(handler, 'makePath'))

  allRedirects.push(handler)
}

export const clearPaths = function() {
  allPathHandlers = {}
  allRedirects = []
}

/**
 * @param {string} windowHash
 * @param {bool} checkingRedirects
 * @returns {Array} matchingHandlers
 */
const findMatches = function(windowHash, checkingRedirects) {
  const workingHash = windowHash || ''
  const cleaned = decodeURI(workingHash.substring(1))

  return _.filter(
    _.map(
      checkingRedirects ? allRedirects : _.toPairs(allPathHandlers),
      function(x) {
        const [k, handler] = checkingRedirects ? [null, x] : x
        if (handler.regex.test(cleaned)) {
          return _.defaults({
            key: k,
            makeProps: () => handler.makeProps.apply(this, _.tail(cleaned.match(handler.regex)))
          }, handler)
        }
      }
    )
  )
}

/**
 * @param {string} windowHash
 * @returns {object} matchingHandler
 */
export const findPathHandler = function(windowHash) {
  const matchingHandlers = findMatches(windowHash, false)
  console.assert(matchingHandlers.length <= 1,
    `Multiple handlers matched path: ${_.map(matchingHandlers, JSON.stringify)}`)
  return _.head(matchingHandlers)
}

/**
 * @param k
 * @param args
 * @returns {string}
 */
export const getPath = function(k, ...args) {
  const handler = allPathHandlers[k]
  console.assert(handler,
    `No handler found for key ${k}. Valid path keys are: ${_.keysIn(allPathHandlers)}`)
  return encodeURI(handler.makePath.apply(this, args))
}

/**
 * @param k
 * @param args
 * @returns {string}
 */
export const getLink = function(k, ...args) {
  return `#${getPath.apply(this, Array.from(arguments))}`
}

/**
 * @param k
 * @param args
 */
export const goToPath = function(k, ...args) {
  window.location.hash = getPath.apply(this, Array.from(arguments))
}

/**
 * @param k
 * @param args
 * @returns {string}
 */
export const isCurrentPath = function(k, ...args) {
  return getPath.apply(this, Array.from(arguments))
}

/**
 * @param windowHash
 * @returns {boolean} true
 */
export const executeRedirects = function(windowHash) {
  const matchingHandlers = findMatches(windowHash, true)
  console.assert(matchingHandlers.length <= 1,
    `Multiple redirects for matched path: ${_.map(matchingHandlers, 'regex')}`)

  if (matchingHandlers[0]) {
    window.location.replace(`#${matchingHandlers[0].makePath()}`)
    return true
  }
}
