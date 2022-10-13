export const asMockedFn = <T extends (...args: unknown[]) => unknown>(fn: T): jest.MockedFunction<T> => {
  return fn as jest.MockedFunction<T>
}
