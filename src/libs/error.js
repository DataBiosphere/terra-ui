import _ from 'lodash/fp'
import { reloadAuthToken, signOut } from 'src/libs/auth'
import { notify, sessionTimeoutProps } from 'src/libs/notifications'


export const reportError = async (title, obj) => {
  if (obj instanceof Response && obj.status === 401 && !(await reloadAuthToken())) {
    notify('info', 'Session timed out', sessionTimeoutProps)
    signOut()
  } else {
    notify('error', title, { detail: await (obj instanceof Response ? obj.text() : obj) })
  }
}

// Transforms an async function so that it catches and reports errors using the provided text
export const withErrorReporting = _.curry((title, fn) => async (...args) => {
  try {
    return await fn(...args)
  } catch (error) {
    reportError(title, error)
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
