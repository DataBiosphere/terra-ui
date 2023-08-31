export type SubscribableSubscription = {
  /** Unsubscribe this callback. */
  unsubscribe: () => void;
};

export type Subscribable<T extends any[]> = {
  /** Subscribe to changes. Callback `fn` will be called each time subscribable's `next` method is called. */
  subscribe: (fn: (...args: T) => void) => SubscribableSubscription;

  /** Call all subscribed callbacks with `args`. */
  next: (...args: T) => void;
};

/**
 * A mechanism for registering callbacks for some state change.
 */
export const subscribable = <T extends any[]>(): Subscribable<T> => {
  let subscribers: ((...args: T) => void)[] = [];
  return {
    subscribe: (fn: (...args: T) => void) => {
      subscribers = [...subscribers, fn];
      return {
        unsubscribe: () => {
          subscribers = subscribers.filter((s) => s !== fn);
        },
      };
    },
    next: (...args: T) => {
      subscribers.forEach((fn) => {
        fn(...args);
      });
    },
  };
};

export type Atom<T> = {
  /** Subscribe to changes. When state is changed, `fn` will be called with the new state and previous state. */
  subscribe: (fn: (value: T, previousValue: T) => void) => SubscribableSubscription;

  /** Get state. */
  get: () => T;

  /** Set state to `value`. */
  set: (value: T) => void;

  /** Update state. Function `fn` is called with the current state and returns the new state. */
  update: (fn: (currentValue: T) => T) => void;

  /** Reset state to intial value. */
  reset: () => void;
};

/**
 * A simple state container inspired by clojure atoms.
 *
 * Method names were chosen based on similarity to lodash and Immutable. (deref => get, reset! => set, swap! => update, reset to go back to initial value).
 */
export const atom = <T>(initialValue: T): Atom<T> => {
  let value = initialValue;
  const { subscribe, next } = subscribable<[T, T]>();
  const get = () => value;
  const set = (newValue: T) => {
    const oldValue = value;
    value = newValue;
    next(newValue, oldValue);
  };
  return { subscribe, get, set, update: (fn) => set(fn(get())), reset: () => set(initialValue) };
};
