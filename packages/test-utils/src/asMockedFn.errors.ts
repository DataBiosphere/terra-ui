import { asMockedFn, partial } from './asMockedFn';
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

interface TestType {
  a: string;
  b: number;
}

// THROWS Type 'string' is not assignable to type 'number'.
partial<TestType>({ b: '7' });

// THROWS Type 'number' is not assignable to type 'string'.
partial<TestType>({ a: 0 });

// THROWS Argument of type '{ aa: string; bb: number; }' is not assignable to parameter of type 'Partial<TestType>'.
partial<TestType>({ aa: 'A', bb: 7 });

// THROWS Argument of type '{ a: string; b: number; c: number; }' is not assignable to parameter of type 'Partial<TestType>'.
partial<TestType>({ a: 'A', b: 7, c: 8 });

// THROWS Type '8' has no properties in common with type 'Partial<TestType>'.
partial<TestType>(8);
