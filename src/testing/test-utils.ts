/*
 * Use when working with a vi.fn() mocked method to get better type safety and IDE hinting on
 * the function signature of what's being mocked.
 *
 * Type "any" is used here to allow for desired type flow during usage where T "looks like a function".
 */
import { MockedFunction } from 'vitest';

export const asMockedFn = <T extends (...args: any[]) => any>(fn: T): MockedFunction<T> => {
  return fn as MockedFunction<T>;
};

export type PromiseController<T> = {
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

/**
 * Returns a promise and a controller that allows manually resolving/rejecting the promise.
 */
export const controlledPromise = <T>(): [Promise<T>, PromiseController<T>] => {
  const controller: PromiseController<T> = {
    resolve: () => {},
    reject: () => {},
  };

  const promise = new Promise<T>((resolve, reject) => {
    controller.resolve = resolve;
    controller.reject = reject;
  });

  return [promise, controller];
};

// This is for the AutoSizer component. It requires screen dimensions in order to be tested properly.
export const setUpAutoSizerTesting = () => {
  Object.defineProperties(window.HTMLElement.prototype, {
    offsetLeft: {
      get() {
        return parseFloat(window.getComputedStyle(this).marginLeft) || 0;
      },
    },
    offsetTop: {
      get() {
        return parseFloat(window.getComputedStyle(this).marginTop) || 0;
      },
    },
    offsetHeight: {
      get() {
        return parseFloat(window.getComputedStyle(this).height) || 0;
      },
    },
    offsetWidth: {
      get() {
        return parseFloat(window.getComputedStyle(this).width) || 0;
      },
    },
  });
};
