/*
  These types are intended for generic pass-thru functions and other utilities that
  need to have good type flow for dealing with functions of unknown arguments or
  return type.  These types are intended to be used as part of other generic types
  that ensure well-typed functions flow through them well.
  Note that the use of type 'any' is not otherwise encouraged.
 */

export type WrapFn<F> = (fn: F) => F
export type AnyFn = (...args: any[]) => any
export type AnyPromiseFn<P = any> = (...args: any[]) => Promise<P>
export type GenericFn<F extends AnyFn> = (...args: Parameters<F>) => ReturnType<F>
export type GenericPromiseFn<F extends AnyPromiseFn, P> = (...args: Parameters<F>) => Promise<P>


