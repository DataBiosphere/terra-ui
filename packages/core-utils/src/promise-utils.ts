/**
 * Returns a promise that will never resolve or reject.
 *
 * Useful for cancelling async flows.
 */
export const abandonedPromise = (): Promise<any> => {
  return new Promise(() => {});
};

export interface PromiseController<T> {
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

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
