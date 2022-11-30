import _ from 'lodash/fp'
import { notify } from 'src/libs/notifications'


export const reportError = async (title, obj) => {
  // Do not show an error notification when a session times out.
  // Notification for this case is handled elsewhere.
  if (obj instanceof Error && obj.message === 'Session timed out') {
    return
  }

  notify('error', title, { detail: await (obj instanceof Response ? obj.text() : obj) })
}

/**
 * Invoke the `callback` with any error thrown when evaluating the async `fn` with `...args`.
 */
export const withErrorHandling = _.curry((callback, fn) => async (...args) => {
  try { return await fn(...args) } catch (error) { await callback(error) }
})

/**
 * Return a Promise to the result of evaluating the async `fn` with `...args` or undefined if
 * evaluation fails.
 */
export const withErrorIgnoring = withErrorHandling(_.noop)

/**
 * Return a Promise to the result of evaluating the async `fn` with `...args`. If evaluation fails,
 * report the error to the user with `title` as a side effect.
 */
export const reportErrorAndRethrow = _.curry((title, fn) => {
  return _.flip(withErrorHandling)(fn, error => {
    reportError(title, error)
    throw error
  })
})

/**
 *  This function is designed for use in modals
 *  Modals can overlay any error reporting, with the `throw` in the default `withErrorReporting`
 *  preventing the modal itself from closing on error
 *  As such, we must ensure we call the dismiss function if an error occurs
 */
export const withErrorReportingInModal = _.curry((title, onDismiss, fn) => {
  return _.flip(withErrorHandling)(fn, error => {
    reportError(title, error)
    onDismiss()
    throw error
  })
})

/**
 * Return a Promise to the result of evaluating the async `fn` with `...args` or undefined if
 * evaluation fails. If evaluation fails, report the error to the user with `title`.
 */
export const withErrorReporting = _.curry((title, fn) => {
  return withErrorIgnoring(reportErrorAndRethrow(title)(fn))
})

