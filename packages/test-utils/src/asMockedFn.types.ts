import { asMockedFn, partial } from './asMockedFn';
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

interface TestType {
  a: string;
  b: number;
}

partial<TestType>({ b: 7 });
partial<TestType>({ a: 'A' });
partial<TestType>({ a: 'A', b: 7 });
partial<TestType>({});
