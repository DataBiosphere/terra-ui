/*
 * Use when working with a jest.fn() mocked method to get better type safety and IDE hinting on
 * the function signature of what's being mocked.
 *
 * Type "any" is used here to allow for desired type flow during usage where T "looks like a function".
 */
export const asMockedFn = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> => {
  return fn as jest.MockedFunction<T>
}
