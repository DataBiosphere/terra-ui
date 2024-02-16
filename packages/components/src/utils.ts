export const DEFAULT = Symbol('Default switch case');

const maybeCall = <T>(maybeFn: T | (() => T)) => (maybeFn instanceof Function ? maybeFn() : maybeFn);

type CondArgType<T> = [boolean | typeof DEFAULT, T | (() => T)] | (() => T);

export const condTyped = <T>(...args: CondArgType<T>[]): T | undefined => {
  for (const arg of args) {
    if (Array.isArray(arg)) {
      const [predicate, value] = arg;
      if (predicate) return maybeCall(value);
    } else {
      return maybeCall(arg);
    }
  }
};

/**
 * Takes any number of [predicate, value] pairs, followed by an optional default value.
 * Returns value() for the first truthy predicate, otherwise returns the default value().
 * Returns undefined if no predicate matches and there is no default value.
 *
 * DEPRECATED: If a value is not a function, it will be returned directly instead.
 * This behavior is deprecated, and will be removed in the future.
 *
 * @Deprecated use condTyped instead
 */
export const cond = (...args: any[]): any => {
  console.assert(
    args.every((arg) => {
      return arg instanceof Function || (Array.isArray(arg) && arg.length === 2 && arg[1] instanceof Function);
    }),
    'Invalid arguments to Utils.cond'
  );
  return condTyped(...args);
};
