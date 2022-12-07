// This syntax gives us nominal typing
// Nominal types are not interchangable even if the underlying type is the same
// A func that takes (a: A, b: B) where A and B are both strings cannot be called like (b,a) with this restriction
import { AnyPromiseFn } from 'src/libs/type-utils/general-types'


export type NominalType<BaseType, Name extends string> = BaseType & { __typeToken: Name }

// modified from https://bobbyhadz.com/blog/javascript-check-if-function-returns-promise
/**
 * Type predicate that will check if a variable (p) is a Promise
 * @param p the variable to check
 */
export const isPromise = (p: unknown): p is Promise<unknown> => {
  const isPromise = (typeof p === 'object' && typeof (p as Promise<unknown>).then === 'function')
  return isPromise
}

// modified from https://bobbyhadz.com/blog/javascript-check-if-function-returns-promise
/**
 * Type predicate that will check if a variable (f) is a function that returns a Promise
 * @param f the variable to check
 */
export const isPromiseReturn = (f: unknown): f is AnyPromiseFn<unknown> => {
  const isPromiseFn = (
    !!f && (
      (f as Function).constructor.name === 'AsyncFunction' ||
          (typeof f === 'function' && isPromise(f()))
    )
  )
  return isPromiseFn
}
