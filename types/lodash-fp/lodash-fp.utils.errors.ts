/* eslint-disable no-unused-vars */
import _ from 'lodash/fp'
import {SafeCurry2, SafeCurry3, SafeCurry4} from "./lodash-fp.utils";


// Curry2 ////////////////////////////////////////////////////////////////

const fnWith2Args_1 = (x: number, y: string): string => {
  return `something interesting`
}
const fnWith2Args_2 = (x: number[], y: string) : string => {
  return `something interesting`
}
const badFn = (arg1: number): string => {
  return 'mischief'
}

const c2Fn1 = _.curry(fnWith2Args_1) as SafeCurry2<typeof fnWith2Args_1>
const c2Fn2 = _.curry(fnWith2Args_2) as SafeCurry2<typeof fnWith2Args_2>

// ( SafeCurry2<F> Generic F type mismatch with fn type given to _.curry )
// THROWS Conversion of type 'CurriedFunction2<number, string, string>' to type 'SafeCurry2<(x: number[], y: string) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c2FnBad = _.curry(fnWith2Args_1) as SafeCurry2<typeof fnWith2Args_2>

// ( SafeCurry2<F> Generic F type mismatch with fn type given to _.curry )
// THROWS Conversion of type 'CurriedFunction2<number[], string, string>' to type 'SafeCurry2<(arg1: number) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c2FnBad2 = _.curry(fnWith2Args_2) as SafeCurry2<typeof badFn>

// ( SafeCurry3<F> type mismatch - expected fn with 3 args but got 2 args )
// THROWS Conversion of type 'CurriedFunction2<number, string, string>' to type 'SafeCurry3<(x: number, y: string) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c2FnBad3 = _.curry(fnWith2Args_1) as SafeCurry3<typeof fnWith2Args_1>

// THROWS No overload matches this call.
const c2result1: string = c2Fn1('4','this is bad')

// THROWS No overload matches this call.
const c2result2: string = c2Fn2([1, 2, 3],666)

const c2FnCurryIdentity = c2Fn2()
const c2FnCurryLast = c2FnCurryIdentity([4,5,6])

// THROWS Argument of type 'number' is not assignable to parameter of type 'string'.
const c2result3: string = c2FnCurryLast(666)

// Curry3 ////////////////////////////////////////////////////////////////

const fnWith3Args_1 = (x: number, y: string, z: string[]): string => {
  return `something interesting`
}
const fnWith3Args_2 = (x: number[], y: string, z: number[]) : string => {
  return `something interesting`
}

const c3Fn1 = _.curry(fnWith3Args_1) as SafeCurry3<typeof fnWith3Args_1>
const c3Fn2 = _.curry(fnWith3Args_2) as SafeCurry3<typeof fnWith3Args_2>

// errors:
// ( SafeCurry3<F> Generic F type mismatch with fn type given to _.curry )
// THROWS Conversion of type 'CurriedFunction3<number, string, string[], string>' to type 'SafeCurry3<(x: number[], y: string, z: number[]) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c3FnBad = _.curry(fnWith3Args_1) as SafeCurry3<typeof fnWith3Args_2>

// ( SafeCurry3<F> Generic F type mismatch with fn type given to _.curry )
// THROWS Conversion of type 'CurriedFunction3<number[], string, number[], string>' to type 'SafeCurry3<(arg1: number) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c3FnBad2 = _.curry(fnWith3Args_2) as SafeCurry3<typeof badFn>

// ( SafeCurry4<F> type mismatch - expected fn with 4 args but got 3 args )
// THROWS Conversion of type 'CurriedFunction3<number, string, string[], string>' to type 'SafeCurry4<(x: number, y: string, z: string[]) => string>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
const c3FnBad3 = _.curry(fnWith3Args_1) as SafeCurry4<typeof fnWith3Args_1>

// THROWS No overload matches this call.
const c3result1: string = c3Fn1(4,"abc", [6])

// THROWS No overload matches this call.
const c3result2: string = c3Fn2([1,2,3], 666, [4, 5])

const c3FnCurryIdentity = c3Fn2()
const c3FnCurryLast2 = c3FnCurryIdentity([4, 5, 6])
const c3FnCurryLast1 = c3FnCurryLast2('still-my-array')

// THROWS Argument of type 'number' is not assignable to parameter of type 'number[]'.
const c3result3: string = c3FnCurryLast1(6)
