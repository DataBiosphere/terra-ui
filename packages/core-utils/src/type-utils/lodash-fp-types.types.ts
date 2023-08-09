/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from 'lodash/fp.js';

import { SafeCurry2, SafeCurry3 } from './lodash-fp-types.js';

// Curry2
const fn1With2Args = (_x: number, _y: string): string => {
  return 'something interesting';
};
const fn2With2Args = (_x: number[], _y: string): string => {
  return 'something interesting';
};

const curriedFn1With2Args = _.curry(fn1With2Args) as SafeCurry2<typeof fn1With2Args>;
const curriedFn2With2Args = _.curry(fn2With2Args) as SafeCurry2<typeof fn2With2Args>;

const c2result1: string = curriedFn1With2Args(4, 'abc');

const c2result2: string = curriedFn2With2Args([1, 2, 3], 'my-array');

const c2FnCurryIdentity = curriedFn2With2Args();
const c2FnCurryLast = c2FnCurryIdentity([4, 5, 6]);
const c2result3: string = c2FnCurryLast('still-my-array');

// Curry3
const fn1With3Args = (_x: number, _y: string, _z: string[]): string => {
  return 'something interesting';
};
const fn2With3Args = (_x: number[], _y: string, _z: number[]): string => {
  return 'something interesting';
};

const curriedFn1With3Args = _.curry(fn1With3Args) as SafeCurry3<typeof fn1With3Args>;
const curriedFn2With3Args = _.curry(fn2With3Args) as SafeCurry3<typeof fn2With3Args>;

const c3result1: string = curriedFn1With3Args(4, 'abc', ['a', 'b']);

const c3result2: string = curriedFn2With3Args([1, 2, 3], 'my-array', [4, 5]);

const c3FnCurryIdentity = curriedFn2With3Args();
const c3FnCurryLast2 = c3FnCurryIdentity([4, 5, 6]);
const c3FnCurryLast1 = c3FnCurryLast2('still-my-array');
const c3result3: string = c3FnCurryLast1([7]);
