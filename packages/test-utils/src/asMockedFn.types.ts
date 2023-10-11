import { asMockedFn } from './asMockedFn';
import { add } from './asMockedFnTestHelper';

type AsMockedFnTestHelperExports = typeof import('./asMockedFnTestHelper');
jest.mock('./asMockedFnTestHelper', (): AsMockedFnTestHelperExports => {
  return {
    ...jest.requireActual<AsMockedFnTestHelperExports>('./asMockedFnTestHelper'),
    add: jest.fn(),
  };
});

asMockedFn(add).mockImplementation((arg1: number, arg2: number): number => {
  return arg1 + arg2;
});

asMockedFn(add).mockReturnValue(2);
