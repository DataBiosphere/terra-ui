import _ from 'lodash'
import * as Config from 'src/libs/config'

const subscribable = () => {
  let value = undefined
  let subscribers = []
  return {
    subscribe: fn => {
      fn(value)
      subscribers = _.union(subscribers, [fn])
    },
    unsubscribe: fn => {
      console.assert(_.includes(subscribers, fn), 'Function is not subscribed')
      subscribers = _.difference(subscribers, [fn])
    },
    set: v => {
      value = v
      subscribers.forEach(fn => fn(v))
    }
  }
}

export const isSignedIn = subscribable()

export const initializeAuth = _.memoize(async () => {
  await new Promise(resolve => window.gapi.load('auth2', resolve))
  await window.gapi.auth2.init({ clientId: await Config.getGoogleClientId() })
  isSignedIn.set(getAuthInstance().isSignedIn.get())
  getAuthInstance().isSignedIn.listen(isSignedIn.set)
})

export const getAuthInstance = function() {
  return window.gapi.auth2.getAuthInstance()
}

export const getUser = function() {
  return getAuthInstance().currentUser.get()
}

export const getAuthToken = function() {
  return getUser().getAuthResponse(true).access_token
}

export const makePrettyDate = function(dateString) {
  const date = new Date(dateString)
  const now = new Date()

  const todayOrYesterday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    (date.getDate() === now.getDate() - 1 || date.getDate() === now.getDate())

  if (todayOrYesterday) {
    return (date.getDate() === now.getDate() ? 'Today' : 'Yesterday') + ' ' +
      date.toLocaleString(navigator.language, { hour: 'numeric', minute: 'numeric' })
  } else {
    return date.toLocaleString(navigator.language, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
  }
}

export const workspaceAccessLevels = ['NO ACCESS', 'READER', 'WRITER', 'OWNER', 'PROJECT_OWNER']

export const log = function(...args) {
  console.groupCollapsed.apply(null, args)
  console.trace('Stack trace:')
  console.groupEnd()
  return _.last(args)
}

const maybeCall = function(maybeFn) {
  return _.isFunction(maybeFn) ? maybeFn() : maybeFn
}

/**
 * Returns the value for the first truthy predicate.
 * If the value is a function, it is invoked.
 *
 * Takes predicate/value pairs in arrays, followed by a default value.
 */
export const cond = function(...args) {
  const defaultValue = _.last(args)
  const pairs = args.slice(0, -1)

  const match = _.find(pairs, _.head)

  return maybeCall(match ? match[1] : defaultValue)
}

/**
 * Memoizes the given function, but expires after the specified duration (ms).
 * The resolver function is used to generate a cache key from the arguments.
 */
export const memoizeWithTimeout = (fn, resolver, ms) => {
  const cache = {}
  return (...args) => {
    const now = Date.now()
    const key = resolver(...args)
    const cached = cache[key]
    if (cached && now < cached.timestamp + ms) {
      return cached.value
    }
    const value = fn(...args)
    cache[key] = { timestamp: now, value }
    return value
  }
}

export const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
