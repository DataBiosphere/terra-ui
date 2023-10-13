export type AnyFn = (...args: any[]) => any;

/**
 * Use when working with a function mocked with jest.mock to tell TypeScript that
 * the function has been mocked and allow accessing mock methods/properties.
 *
 * @example
 * import { someFunction } from 'path/to/module';
 *
 * jest.mock('path/to/module', () => {
 *   return {
 *     ...jest.requireActual('path/to/module'),
 *     someFunction: jest.fn(),
 *   }
 * })
 *
 * asMockedFn(someFunction).mockImplementation(...)
 */
export const asMockedFn = <T extends AnyFn>(fn: T): jest.MockedFunction<T> => {
  return fn as jest.MockedFunction<T>;
};
