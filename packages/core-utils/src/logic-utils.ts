type CondCase<T> = [boolean, (() => T) | T];
type CondDefault<T> = (() => T) | T;

type Cond = {
  <T>(...args: [...CondCase<T>[], CondDefault<T>]): T;
  <T>(...args: CondCase<T>[]): T | undefined;
};

const maybeCall = <T>(arg: (() => T) | T): T => {
  return arg instanceof Function ? arg() : arg;
};

/**
 * Takes any number of [predicate, factory] cases, followed by an optional default factory.
 * Returns factory() for the first truthy predicate, otherwise returns the default factory().
 * Returns undefined if no predicate matches and there is no default factory.
 */
export const cond: Cond = (...args) => {
  for (const arg of args) {
    if (Array.isArray(arg)) {
      if (arg[0]) {
        return maybeCall(arg[1]);
      }
    } else {
      return maybeCall(arg);
    }
  }
  return undefined;
};

export const DEFAULT = Symbol('Default switch case');

type SwitchCaseCase<T, U> = [T, () => U];
type SwitchCaseDefault<U> = [typeof DEFAULT, () => U] | (() => U);

type SwitchCase = {
  <T, U>(value: T, ...args: [...SwitchCaseCase<T, U>[], SwitchCaseDefault<U>]): U;
  <T, U>(value: T, ...args: SwitchCaseCase<T, U>[]): U | undefined;
};

/**
 * Takes a `value` and any number of [candidate, factory] cases, followed by an optional default factory.
 * Returns factory() for the first case where candidate matches `value`, otherwise returns the default factory().
 * Returns undefined if no candidate matches and there is no default factory.
 */
export const switchCase: SwitchCase = (value, ...args) => {
  for (const arg of args) {
    if (Array.isArray(arg)) {
      if (arg[0] === value || arg[0] === DEFAULT) {
        return arg[1]();
      }
    }
    if (arg instanceof Function) {
      return arg();
    }
  }
  return undefined;
};
