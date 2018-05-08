import _ from 'lodash'


let allPathHandlers = {}

/**
 * @param {string} k - key for path
 * @param {object} handler
 * @param {RegExp} handler.regex - regex with capture groups for props
 * @param handler.render - takes regex matches, returns rendered element
 * @param {Function(): string} handler.makePath - takes regex matches, returns string path to go after '#'
 */
export const defPath = function(k, handler) {
  console.assert(_.has(handler, 'regex'))
  console.assert(_.has(handler, 'render'))
  console.assert(_.has(handler, 'makePath'))

  console.assert(!_.has(allPathHandlers, k), `Key ${k} is already defined`)

  allPathHandlers[k] = handler
}

let allRedirects = []

/**
 * @param {RegExp} handler.regex - regex with capture groups for props
 * @param {Function(): string} handler.makePath - takes regex matches, returns string path to go after '#'
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

const decodeHash = hash => decodeURI(hash.substring(1))

/**
 * @param {string} windowHash
 * @returns {object} matchingHandler
 */
export const renderPath = windowHash => {
  const hash = decodeHash(windowHash)
  const matchingHandlers = _.filter(allPathHandlers, ({ regex }) => regex.test(hash))
  console.assert(matchingHandlers.length <= 1,
    `Multiple handlers matched path: ${_.map(matchingHandlers, JSON.stringify)}`)
  const handler = matchingHandlers[0]
  return handler && handler.render(..._.tail(hash.match(handler.regex)))
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
 * @returns {boolean} redirect executed?
 */
export const executeRedirects = windowHash => {
  const hash = decodeHash(windowHash)
  const matchingHandlers = _.filter(allRedirects, ({ regex }) => regex.test(hash))
  console.assert(matchingHandlers.length <= 1,
    `Multiple redirects for matched path: ${_.map(matchingHandlers, 'regex')}`)

  if (matchingHandlers[0]) {
    window.location.replace(`#${matchingHandlers[0].makePath()}`)
  }

  return (matchingHandlers.length > 0)
}
