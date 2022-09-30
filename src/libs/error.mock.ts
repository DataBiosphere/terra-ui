import _ from 'lodash/fp'

/**
 * Allows observation of when an error occurs via `errorWatcher`, i.e.:
 *     expect(errorWatcher).toHaveBeenCalledTimes(1)
 *     expect(errorWatcher).toHaveBeenCalledWith('my error message', expect.anything())
 * You must use `jest.resetMocks` in `beforeEach` to clear the errorWatcher between tests
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
    } finally {
      onDismiss()
    }
  }
  return errorHandler
})
