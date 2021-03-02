import _ from 'lodash/fp'
import * as Utils from 'src/libs/utils'
import { maybeParseJSON, subscribable } from 'src/libs/utils'


/*
 * This library provides a higher level interface on top of localStorage and sessionStorage.
 * Values must be JSON-serializable. The 'dynamic' version is preferred if possible, but dynamic
 * values might be deleted in case of space overflow. For critical data, use the 'static' version.
 */

const forceSetItem = (storage, key, value) => {
  while (true) {
    try {
      storage.setItem(key, value)
      return
    } catch (error) {
      const candidates = _.filter(([k]) => _.startsWith('dynamic-storage/', k), _.toPairs(storage))
      if (!candidates.length) {
        console.error('Could not write to storage, and no entries to delete')
        return
      }
      const [chosenKey] = _.head(_.sortBy(([k, v]) => {
        const data = maybeParseJSON(v)
        return data && _.isInteger(data.timestamp) ? data.timestamp : -Infinity
      }, candidates))
      storage.removeItem(chosenKey)
    }
  }
}

export const getStatic = (storage, key) => {
  return maybeParseJSON(storage.getItem(key))
}

export const setStatic = (storage, key, value) => {
  if (value === undefined) {
    storage.removeItem(key)
  } else {
    forceSetItem(storage, key, JSON.stringify(value))
  }
}

export const listenStatic = (storage, key, fn) => {
  window.addEventListener('storage', e => {
    if (e.storageArea === storage && e.key === key) {
      fn(maybeParseJSON(e.newValue))
    }
  })
}

export const getDynamic = (storage, key) => {
  const storageKey = `dynamic-storage/${key}`
  const data = maybeParseJSON(storage.getItem(storageKey))
  return data && data.value
}

export const setDynamic = (storage, key, value) => {
  const storageKey = `dynamic-storage/${key}`
  if (value === undefined) {
    storage.removeItem(storageKey)
  } else {
    forceSetItem(storage, storageKey, JSON.stringify({ timestamp: Date.now(), value }))
  }
}

export const listenDynamic = (storage, key, fn) => {
  const storageKey = `dynamic-storage/${key}`
  window.addEventListener('storage', e => {
    if (e.storageArea === storage && e.key === storageKey) {
      const data = maybeParseJSON(e.newValue)
      fn(data && data.value)
    }
  })
}

/**
 * Returns a stateful object that manages the given storage location.
 * Implements the Store interface, and can be passed to useStore.
 */

export const staticStorageSlot = (storage, key) => {
  const { subscribe, next } = subscribable()
  const get = () => getStatic(storage, key)
  const set = newValue => {
    setStatic(storage, key, newValue)
    next(newValue)
  }
  listenStatic(storage, key, next)
  return { subscribe, get, set, update: fn => set(fn(get())) }
}

export const useStaticStorageSlot = (storage, key) => {
  const store = staticStorageSlot(storage, key)
  return [Utils.useStore(store), value => store.set(value)]
}

export const dynamicStorageSlot = (storage, key) => {
  const { subscribe, next } = subscribable()
  const get = () => getDynamic(storage, key)
  const set = newValue => {
    setDynamic(storage, key, newValue)
    next(newValue)
  }
  listenDynamic(storage, key, next)
  return { subscribe, get, set, update: fn => set(fn(get())) }
}

export const useDynamicStorageSlot = (storage, key) => {
  const store = dynamicStorageSlot(storage, key)
  return [Utils.useStore(store), newValue => store.set(newValue)]
}
