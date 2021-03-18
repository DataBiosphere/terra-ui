import _ from 'lodash/fp'
import { reloadAuthToken, signOut } from 'src/libs/auth'
import { notify, sessionTimeoutProps } from 'src/libs/notifications'


export const reportErrorWith = _.curry(async (notifyFn, title, obj) => {
  if (obj instanceof Response && obj.status === 401 && !(await reloadAuthToken())) {
    notifyFn('info', 'Session timed out', sessionTimeoutProps)
    signOut()
  } else {
    notifyFn('error', title, { detail: await (obj instanceof Response ? obj.text() : obj) })
  }
})
export const reportError = reportErrorWith(notify)

// Transforms an async function so that it catches and reports errors using the provided text
export const withErrorReporting = _.curry((titleOrHandler, fn) => async (...args) => {
  try {
    return await fn(...args)
  } catch (error) {
    if (_.isFunction(titleOrHandler)) {
      titleOrHandler(error)
    } else {
      reportError(titleOrHandler, error)
    }
  }
})

// Transforms an async function so that it catches and ignores errors
export const withErrorIgnoring = fn => async (...args) => {
  try {
    return await fn(...args)
  } catch (error) {
    // ignore error
  }
}
