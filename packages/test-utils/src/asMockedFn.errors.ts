import { asMockedFn } from './asMockedFn';
import { add } from './asMockedFnTestHelper';

type AsMockedFnTestHelperExports = typeof import('./asMockedFnTestHelper');
jest.mock('./asMockedFnTestHelper', (): AsMockedFnTestHelperExports => {
  return {
    ...jest.requireActual<AsMockedFnTestHelperExports>('./asMockedFnTestHelper'),
    add: jest.fn(),
  };
});

// THROWS Argument of type '(arg1: string, arg2: string) => number' is not assignable to parameter of type '(arg1: number, arg2: number) => number'.
asMockedFn(add).mockImplementation((arg1: string, arg2: string): number => {
  return arg1.length + arg2.length;
});

// THROWS Argument of type 'string' is not assignable to parameter of type 'number'.
asMockedFn(add).mockReturnValue('2');
