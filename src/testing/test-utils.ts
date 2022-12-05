/*
 * Use when working with a jest.fn() mocked method to get better type safety and IDE hinting on
 * the function signature of what's being mocked.
 *
 * Type "any" is used here to allow for desired type flow during usage where T "looks like a function".
 */
export const asMockedFn = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> => {
  return fn as jest.MockedFunction<T>
}

export type PromiseController<T> = {
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

/**
 * Returns a promise and a controller that allows manually resolving/rejecting the promise.
 */
export const controlledPromise = <T>(): [Promise<T>, PromiseController<T>] => {
  const controller: PromiseController<T> = {
    resolve: () => {},
    reject: () => {},
  }

  const promise = new Promise<T>((resolve, reject) => {
    controller.resolve = resolve
    controller.reject = reject
  })

  return [promise, controller]
}
