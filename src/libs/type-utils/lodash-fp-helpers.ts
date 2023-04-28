import _ from "lodash/fp";
import { AnyFn, AnyPromiseFn, GenericFn, WrapFn } from "src/libs/type-utils/general-types";
import { SafeCurry2, SafeCurry3, SafeCurry4, SafeCurry5 } from "src/libs/type-utils/lodash-fp-types";

/*
 * The helpers in this file are to provide even better type safety then the baseline lodash-fp utils
 * can give when the scenario is known and specific, or a scenario presents additional type-safety
 * challenges that the baseline type utils can't fully give type safety for.
 */

export interface WithHandlersFn {
  <P, A extends any[], F extends (...args: A) => Promise<P>>(
    handlers: WrapFn<(...args: A) => Promise<P | unknown>>[],
    mainFn: F
  ): F;
  <F extends AnyFn, F2 extends F>(handlers: WrapFn<GenericFn<F2>>[], mainFn: F): GenericFn<F>;
}

/**
 * Provides better type flow and ergonomics for the common case of wrapping
 * a main function with additional pass-thru wrapper functions (handlers).
 * These handlers are expected to be HoF's (higher order functions) that
 * return a wrapped function with the desired handling logic which still honors
 * the same function signature of the fn it is given as it's single argument.
 * @param handlers - Array of handler (wrapper) functions to apply to mainFn
 * @param mainFn - The main function being wrapped with handlers
 */
export const withHandlers: WithHandlersFn = <F extends AnyFn>(handlers: WrapFn<F>[], mainFn: F) => {
  const resultFn = _.flow(...handlers)(mainFn);
  return resultFn;
};

export interface CurryLastArgFn {
  <A, LAST, R>(fn: (a: A, last: LAST) => R): (a: A) => (last: LAST) => R;
  <A, B, LAST, R>(fn: (a: A, b: B, last: LAST) => R): (a: A, b: B) => (last: LAST) => R;
  <A, B, C, LAST, R>(fn: (a: A, b: B, c: C, last: LAST) => R): (a: A, b: B, c: C) => (last: LAST) => R;
  <A, B, C, D, LAST, R>(fn: (a: A, b: B, c: C, d: D, last: LAST) => R): (a: A, b: B, c: C, d: D) => (last: LAST) => R;
}

/**
 * Produces a curried function that expect the last argument to be given
 * before executing the original function.
 * Provides better type flow then the more general _.curry(fn).
 * @param fn - Function with up to 5 arguments
 */
export const curryLastArg: CurryLastArgFn = (fn: (...args: unknown[]) => unknown) => {
  return (...args2: unknown[]) => {
    return (last: unknown) => {
      return fn(...args2, last);
    };
  };
};

export interface SafeCurryXFn {
  <F extends (a: any, b: any) => any>(fn: F): SafeCurry2<F>;
  <F extends (a: any, b: any, c: any) => any>(fn: F): SafeCurry3<F>;
  <F extends (a: any, b: any, c: any, d: any) => any>(fn: F): SafeCurry4<F>;
  <F extends (a: any, b: any, c: any, d: any, e: any) => any>(fn: F): SafeCurry5<F>;
}

/**
 * curry's a function using Lodash.curry() but with greatly improved type
 * safety and flow.
 *
 * @param fn a function with up to 5 arguments, which will be curried
 */
export const safeCurry: SafeCurryXFn = (fn: AnyFn) => {
  return _.curry(fn);
};

/**
 * (non-async) A convenience helper for creating handler-wrapper functions
 * that add logic and/or side effects but produce a wrapped function that
 * preserves the function signature of the original function.  This helper
 * removes the concern of original function arguments by providing a
 * zero-argument executor argument that the given handler function can call.
 * When used with recommended patterns (see unit tests) the need for
 * currying is removed.
 * @param handler - The handler function that will use executor arg to run
 *    the original function
 */
export const createHandler = <F extends AnyFn>(handler: (executor: () => ReturnType<F>) => ReturnType<F>) => {
  const wrappedFn = (fn: (...args: Parameters<F>) => ReturnType<F>) => {
    const innerFn = (...fnArgs: Parameters<F>): ReturnType<F> => {
      const executor = (): ReturnType<F> => {
        const result: ReturnType<F> = fn(...fnArgs);
        return result;
      };
      const handlerResult = handler(executor);
      return handlerResult;
    };
    return innerFn;
  };
  return wrappedFn;
};

/**
 * (async) A convenience helper for creating handler-wrapper functions
 * that add logic and/or side effects but produce a wrapped function that
 * preserves the function signature of the original function.  This helper
 * removes the concern of original function arguments by providing a
 * zero-argument executor argument that the given handler function can call.
 * When used with recommended patterns (see unit tests) the need for
 * currying is removed.
 * @param handler - The handler function that will use executor arg to run
 *    the original function
 */
export const createHandlerAsync = <P, F extends AnyPromiseFn<P>>(
  handler: (executor: () => Promise<P>) => Promise<P>
) => {
  const wrappedFn = (fn: (...args: Parameters<F>) => Promise<P>) => {
    const innerFn = async (...fnArgs: Parameters<F>): Promise<P> => {
      const executor = async (): Promise<P> => {
        const result: P = await fn(...fnArgs);
        return result;
      };
      const handlerResult = await handler(executor);
      return handlerResult;
    };
    return innerFn;
  };
  return wrappedFn;
};
