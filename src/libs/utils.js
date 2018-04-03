import _ from 'lodash'


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

export const log = function(arg) {
  console.log(arg)
  return arg
}

const maybeCall = function(maybeFn) {
  return _.isFunction(maybeFn) ? maybeFn() : maybeFn
}

/**
 * Returns the value for the first truthy predicate.
 *
 * Takes predicate/value pairs in arrays, followed by a default value.
 */
export const cond = function(...args) {
  const defaultValue = _.last(args)
  const pairs = args.slice(0, -1)

  const match = _.find(pairs, ([pred, val]) => {
    return pred ? maybeCall(val) : false
  })

  return match ? match[1] : maybeCall(defaultValue)
}
