import _ from 'lodash/fp'
import { maybeParseJSON } from 'src/libs/utils'


export const getDynamic = (storage, key) => {
  const storageKey = `dynamic-storage/${key}`
  const data = maybeParseJSON(storage.getItem(storageKey))
  return data && data.value
}

export const setDynamic = (storage, key, value) => {
  const storageKey = `dynamic-storage/${key}`
  const storageValue = JSON.stringify({ timestamp: Date.now(), value })
  while (true) {
    try {
      storage.setItem(storageKey, storageValue)
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

export const removeDynamic = (storage, key) => {
  const storageKey = `dynamic-storage/${key}`
  storage.removeItem(storageKey)
}

export const getLocalPref = key => getDynamic(localStorage, key)
export const setLocalPref = (key, value) => setDynamic(localStorage, key, value)
