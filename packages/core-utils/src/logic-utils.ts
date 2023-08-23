type CondCase<T> = [boolean, () => T];
type CondDefault<T> = () => T;

type Cond = {
  <T>(...args: [...CondCase<T>[], CondDefault<T>]): T;
  <T>(...args: CondCase<T>[]): T | undefined;
};

/**
 * Takes any number of [predicate, factory] cases, followed by an optional default factory.
 * Returns factory() for the first truthy predicate, otherwise returns the default factory().
 * Returns undefined if no predicate matches and there is no default factory.
 */
export const cond: Cond = (...args) => {
  for (const arg of args) {
    if (Array.isArray(arg) && arg[0]) {
      return arg[1]();
    }
    if (arg instanceof Function) {
      return arg();
    }
  }
  return undefined;
};

type SwitchCaseCase<T, U> = [T, () => U];
type SwitchCaseDefault<U> = () => U;

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
    if (Array.isArray(arg) && arg[0] === value) {
      return arg[1]();
    }
    if (arg instanceof Function) {
      return arg();
    }
  }
  return undefined;
};
