/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from 'lodash/fp'

import { SafeCurry2, SafeCurry3, SafeCurry4 } from '../../src/libs/type-utils/lodash-fp-types'


// Curry2 ////////////////////////////////////////////////////////////////

const fn1With2Args = (_x: number, _y: string): string => {
  return 'something interesting'
}
const fn2With2Args = (_x: number[], _y: string) : string => {
  return 'something interesting'
}

// used to force expected type errors on function signature
const badFn = (_arg1: number): string => {
  return 'mischief'
}

const curriedFn1With2Args = _.curry(fn1With2Args) as SafeCurry2<typeof fn1With2Args>
const curriedFn2With2Args = _.curry(fn2With2Args) as SafeCurry2<typeof fn2With2Args>

// ( SafeCurry2<F> Generic F type mismatch with fn type given to _.curry )
// THROWS Conversion of type 'CurriedFunction2<number, string, string>' to type 'SafeCurry2<(_x: number[], _y: string) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c2FnBad = _.curry(fn1With2Args) as SafeCurry2<typeof fn2With2Args>

// ( SafeCurry2<F> Generic F type mismatch with fn type given to _.curry )
// THROWS Conversion of type 'CurriedFunction2<number[], string, string>' to type 'SafeCurry2<(_arg1: number) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c2FnBad2 = _.curry(fn2With2Args) as SafeCurry2<typeof badFn>

// ( SafeCurry3<F> type mismatch - expected fn with 3 args but got 2 args )
// THROWS Conversion of type 'CurriedFunction2<number, string, string>' to type 'SafeCurry3<(_x: number, _y: string) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c2FnBad3 = _.curry(fn1With2Args) as SafeCurry3<typeof fn1With2Args>

// THROWS No overload matches this call.
const c2result1: string = curriedFn1With2Args('4', 'this is bad')

// THROWS No overload matches this call.
const c2result2: string = curriedFn2With2Args([1, 2, 3], 666)

const c2FnCurryIdentity = curriedFn2With2Args()
const c2FnCurryLast = c2FnCurryIdentity([4, 5, 6])

// THROWS Argument of type 'number' is not assignable to parameter of type 'string'.
const c2result3: string = c2FnCurryLast(666)

// Curry3 ////////////////////////////////////////////////////////////////

const fn1With3Args = (_x: number, _y: string, _z: string[]): string => {
  return 'something interesting'
}
const fn2With3Args = (_x: number[], _y: string, _z: number[]) : string => {
  return 'something interesting'
}

const curriedFn1With3Args = _.curry(fn1With3Args) as SafeCurry3<typeof fn1With3Args>
const curriedFn2With3args = _.curry(fn2With3Args) as SafeCurry3<typeof fn2With3Args>

// errors:
// ( SafeCurry3<F> Generic F type mismatch with fn type given to _.curry )
// THROWS Conversion of type 'CurriedFunction3<number, string, string[], string>' to type 'SafeCurry3<(_x: number[], _y: string, _z: number[]) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c3FnBad = _.curry(fn1With3Args) as SafeCurry3<typeof fn2With3Args>

// ( SafeCurry3<F> Generic F type mismatch with fn type given to _.curry )
// THROWS Conversion of type 'CurriedFunction3<number[], string, number[], string>' to type 'SafeCurry3<(_arg1: number) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c3FnBad2 = _.curry(fn2With3Args) as SafeCurry3<typeof badFn>

// ( SafeCurry4<F> type mismatch - expected fn with 4 args but got 3 args )
// THROWS Conversion of type 'CurriedFunction3<number, string, string[], string>' to type 'SafeCurry4<(_x: number, _y: string, _z: string[]) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c3FnBad3 = _.curry(fn1With3Args) as SafeCurry4<typeof fn1With3Args>

// THROWS No overload matches this call.
const c3result1: string = curriedFn1With3Args(4, 'abc', [6])

// THROWS No overload matches this call.
const c3result2: string = curriedFn2With3args([1, 2, 3], 666, [4, 5])

const c3FnCurryIdentity = curriedFn2With3args()
const c3FnCurryLast2 = c3FnCurryIdentity([4, 5, 6])
const c3FnCurryLast1 = c3FnCurryLast2('still-my-array')

// THROWS Argument of type 'number' is not assignable to parameter of type 'number[]'.
const c3result3: string = c3FnCurryLast1(6)
