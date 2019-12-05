import _ from 'lodash/fp'
import { getUser } from 'src/libs/auth'
import { maybeParseJSON } from 'src/libs/utils'


export const getDynamic = (storage, key, { important = false } = {}) => {
  const storageKey = maybeImportantKey(important, `dynamic-storage/${key}`)
  const data = maybeParseJSON(storage.getItem(storageKey))
  return data && data.value
}

export const setDynamic = (storage, key, value, { important = false } = {}) => {
  const storageKey = maybeImportantKey(important, `dynamic-storage/${key}`)
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

const withUserPrefix = key => `${getUser().id}/${key}`
const maybeImportantKey = (important, key) => important ? `important/${key}` : key

export const getLocalPref = key => getDynamic(localStorage, withUserPrefix(key))
export const setLocalPref = (key, value) => setDynamic(localStorage, withUserPrefix(key), value)
