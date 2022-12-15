import _ from 'lodash/fp'

/**
 * Allows observation of when an error occurs via `errorWatcher`, i.e.:
 *     expect(errorWatcher).toHaveBeenCalledTimes(1)
 *     expect(errorWatcher).toHaveBeenCalledWith('my error message', expect.anything())
 * The errorWatcher call counts and information will be cleared in between tests,
 * thanks to Jest being configured to auto-clear mock between tests at the project level.
 */
export const errorWatcher = jest.fn()

/**
 * Provides a mocked version of error module's withErrorReportingInModal
 */
export const mockWithErrorReportingInModal = _.curry((title, onDismiss, fn) => {
  const errorHandler = async () => {
    try {
      return await fn()
    } catch (error) {
      errorWatcher(title, error)
      onDismiss()
    }
  }
  return errorHandler
})
