import _ from "lodash/fp";
import { maybeParseJSON, subscribable } from "src/libs/utils";

/**
 * This library provides a higher level interface on top of localStorage and sessionStorage.
 * Values must be JSON-serializable. The 'dynamic' version is preferred if possible, but dynamic
 * values might be deleted in case of space overflow. For critical data, use the 'static' version.
 */

class InMemoryStorage {
  storage = Object.create(null);

  get length() {
    return _.size(this.storage);
  }

  key(index) {
    return Object.keys(this.storage)[index] || null;
  }

  getItem(key) {
    return _.has(key, this.storage) ? _.get(key, this.storage) : null;
  }

  setItem(key, value) {
    this.storage[key] = value;
  }

  removeItem(key) {
    delete this.storage[key];
  }

  clear() {
    this.storage = Object.create(null);
  }
}

export const getLocalStorage = _.once(() => {
  try {
    return window.localStorage;
  } catch (error) {
    return new InMemoryStorage();
  }
});

export const getSessionStorage = _.once(() => {
  try {
    return window.sessionStorage;
  } catch (error) {
    return new InMemoryStorage();
  }
});

const forceSetItem = (storage, key, value) => {
  while (true) {
    try {
      storage.setItem(key, value);
      return;
    } catch (error) {
      const candidates = _.filter(([k]) => _.startsWith("dynamic-storage/", k), _.toPairs(storage));
      if (!candidates.length) {
        console.error("Could not write to storage, and no entries to delete");
        return;
      }
      const [chosenKey] = _.head(
        _.sortBy(([_k, v]) => {
          const data = maybeParseJSON(v);
          return data && _.isInteger(data.timestamp) ? data.timestamp : -Infinity;
        }, candidates)
      );
      storage.removeItem(chosenKey);
    }
  }
};

export const getStatic = (storage, key) => {
  return maybeParseJSON(storage.getItem(key));
};

/**
 * Sets a key/value in browser storage, or removes the key from storage if `value` is undefined.
 *
 * Static storage will not be automatically deleted in the case of space overflow. If your storage usage
 * is transient (for example, navigating between routes and preserving data where the loss of it is not
 * critical), instead use `setDynamic`.
 *
 * See also `staticStorageSlot`, which can be passed to the `useStore` hook function.
 *
 * @param storage an object implementing the Storage interface
 * @param key the key for storing the value
 * @param value the new JSON-serializable value to be stored, or `undefined` to remove the key.
 */
export const setStatic = (storage, key, value) => {
  if (value === undefined) {
    storage.removeItem(key);
  } else {
    forceSetItem(storage, key, JSON.stringify(value));
  }
};

export const listenStatic = (storage, key, fn) => {
  window.addEventListener("storage", (e) => {
    if (e.storageArea === storage && e.key === key) {
      fn(maybeParseJSON(e.newValue));
    }
  });
};

export const getDynamic = (storage, key) => {
  const storageKey = `dynamic-storage/${key}`;
  const data = maybeParseJSON(storage.getItem(storageKey));
  return data?.value;
};

/**
 * Sets a key/value in browser storage, or removes the key from storage if `value` is undefined.
 *
 * Dynamic storage will be automatically deleted in the case of space overflow, deleting oldest stored
 * data first. If your storage usage is not transient, instead use `setStatic`.
 *
 * @param storage an object implementing the Storage interface
 * @param key the key for storing the value. Note that it will be prefixed by a value to allow separating
 * static from dynamic storage.
 * @param value the new JSON-serializable value to be stored, or `undefined` to remove the key
 */
export const setDynamic = (storage, key, value) => {
  const storageKey = `dynamic-storage/${key}`;
  if (value === undefined) {
    storage.removeItem(storageKey);
  } else {
    forceSetItem(storage, storageKey, JSON.stringify({ timestamp: Date.now(), value }));
  }
};

export const listenDynamic = (storage, key, fn) => {
  const storageKey = `dynamic-storage/${key}`;
  window.addEventListener("storage", (e) => {
    if (e.storageArea === storage && e.key === storageKey) {
      const data = maybeParseJSON(e.newValue);
      fn(data?.value);
    }
  });
};

/**
 * Implements the Store interface, and can be passed to useStore.
 *
 * Note that this method will use static storage, meaning that it will not
 * automatically be deleted in the case of space overflow. If the data you are using
 * is transient, consider using `setDynamic` instead.
 *
 * @param storage an object implementing the Storage interface
 * @param key the key for storing the value
 * @returns stateful object that manages the given storage location
 */
export const staticStorageSlot = (storage, key) => {
  const { subscribe, next } = subscribable();
  const get = () => getStatic(storage, key);
  const set = (newValue) => {
    setStatic(storage, key, newValue);
    next(newValue);
  };
  listenStatic(storage, key, next);
  return { subscribe, get, set, update: (fn) => set(fn(get())) };
};
