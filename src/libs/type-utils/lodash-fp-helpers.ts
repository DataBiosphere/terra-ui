import _ from 'lodash/fp'

export type WrapFn<F> = (fn: F) => F
export type AnyFn = (...args: any[]) => any
export type AnyPromiseFn<P = any> = (...args: any[]) => Promise<P>

export type GenericFn<F extends AnyFn> = (...args: Parameters<F>) => ReturnType<F>
export type GenericPromiseFn<F extends AnyPromiseFn, P> = (...args: Parameters<F>) => Promise<P>

/**
 * Provides better type flow and ergonomics for the common case of wrapping a
 * main function (typically a data call that returns a promise) with
 * additional pass-thru wrapper functions (handlers) to handle things like
 * errors or retry.  These handlers are expected to be HoF's
 * (higher order functions) that return a wrapped function with the desired
 * handling logic which still honors the same function signature of the fn
 * it is given as it's single argument
 * @param mainFn
 * @param handlers
 */

export function withHandlers<P, A extends any[], F extends (...args: A) => Promise<P>, F2 extends F>(
    handlers: WrapFn<(...args: A) => Promise<P | unknown>>[],
    mainFn: F
): F
export function withHandlers<F extends AnyFn, F2 extends F>(
    handlers: WrapFn<GenericFn<F2>>[],
    mainFn: F
): GenericFn<F>
export function withHandlers<F extends AnyFn>(
    handlers: ((fn: F) => F)[],
    mainFn: F,
): F {
  const resultFn = _.flow(...handlers)(mainFn)
  return resultFn
}

// export function withHandlersAsync<P, A extends any[], F extends (...args: A) => Promise<P>, F2 extends F>(
//     mainFn: F,
//     handlers: WrapFn<(...args: A) => Promise<P | unknown>>[]
// ): F {
//   const resultFn: F = _.flow(...handlers)(mainFn)
//   return resultFn
// }

export function curryLastArg<A, LAST, R>(fn: (a: A, last: LAST) => R ) : (a: A) => (last: LAST) => R;
export function curryLastArg<A, B, LAST, R>(fn: (a: A, b: B, last: LAST) => R ) : (a: A, b: B) => (last: LAST) => R;
export function curryLastArg<A, B, C, LAST, R>(fn: (a: A, b: B, c: C, last: LAST) => R ) : (a: A, b: B, c: C) => (last: LAST) => R;
export function curryLastArg<A, B, C, D, LAST, R>(fn: (a: A, b: B, c: C, d:D, last: LAST) => R ) : (a: A, b: B, c: C, d: D) => (last: LAST) => R;
export function curryLastArg(fn: (
    ...args: unknown[]) => unknown) {
  return (...args2: unknown[]) => {
    return (last: unknown) => {
      return fn(...args2, last)
    }
  }
}

//////////

export const createHandler = <F extends (...args: any[]) => any>(
    handler: (executor: () => ReturnType<F>) => ReturnType<F>
) => {
  const wrappedFn = (fn: (...args: Parameters<F>) => ReturnType<F>) => {
    const innerFn = (...fnArgs: Parameters<F>): ReturnType<F> => {
      const executor = (): ReturnType<F> => {
        const result: ReturnType<F> = fn(...fnArgs)
        return result
      }
      const handlerResult = handler(executor)
      return handlerResult
    }
    return innerFn
  }
  return wrappedFn
}

export const createHandlerAsync = <P, F extends (...args: any[]) => Promise<P>>(
    handler: (executor: () => Promise<P>) => Promise<P>
) => {
  const wrappedFn = (fn: (...args: Parameters<F>) => Promise<P>) => {
    const innerFn = async (...fnArgs: Parameters<F>): Promise<P> => {
      const executor = async (): Promise<P> => {
        const result: P = await fn(...fnArgs)
        return result
      }
      const handlerResult = await handler(executor)
      return handlerResult
    }
    return innerFn
  }
  return wrappedFn
}
