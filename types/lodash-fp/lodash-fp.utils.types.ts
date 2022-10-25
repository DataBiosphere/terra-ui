/* eslint-disable no-unused-vars */
import _ from 'lodash/fp'
import {SafeCurry2, SafeCurry3} from "./lodash-fp.utils";


// Curry2
const fnWith2Args_1 = (x: number, y: string): string => {
  return `something interesting`
}
const fnWith2Args_2 = (x: number[], y: string) : string => {
  return `something interesting`
}

const c2Fn1 = _.curry(fnWith2Args_1) as SafeCurry2<typeof fnWith2Args_1>
const c2Fn2 = _.curry(fnWith2Args_2) as SafeCurry2<typeof fnWith2Args_2>

const c2result1: string = c2Fn1(4,"abc")

const c2result2: string = c2Fn2([1,2,3],"my-array")

const c2FnCurryIdentity = c2Fn2()
const c2FnCurryLast = c2FnCurryIdentity([4,5,6])
const c2result3: string = c2FnCurryLast('still-my-array')

// Curry3
const fnWith3Args_1 = (x: number, y: string, z: string[]): string => {
  return `something interesting`
}
const fnWith3Args_2 = (x: number[], y: string, z: number[]) : string => {
  return `something interesting`
}

const c3Fn1 = _.curry(fnWith3Args_1) as SafeCurry3<typeof fnWith3Args_1>
const c3Fn2 = _.curry(fnWith3Args_2) as SafeCurry3<typeof fnWith3Args_2>

const c3result1: string = c3Fn1(4,"abc", ['a', 'b'])

const c3result2: string = c3Fn2([1,2,3], "my-array", [4, 5])

const c3FnCurryIdentity = c3Fn2()
const c3FnCurryLast2 = c3FnCurryIdentity([4, 5, 6])
const c3FnCurryLast1 = c3FnCurryLast2('still-my-array')
const c3result3: string = c3FnCurryLast1([7])


