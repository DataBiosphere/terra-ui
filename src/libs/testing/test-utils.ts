// eslint-disable-next-line
export const asMockedFn = <T extends (...args: any[]) => any>(
  fn: T
): jest.MockedFunction<T> => {
  return fn as jest.MockedFunction<T>
}
