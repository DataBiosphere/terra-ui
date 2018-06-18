import _ from 'lodash/fp'
import uuid from 'uuid/v4'


const getKey = () => {
  const state = window.history.state
  if (state && state.key) {
    return state.key
  } else {
    const key = `state-history-${uuid()}`
    window.history.replaceState({ key }, '')
    return key
  }
}


export const get = () => {
  const fetched = sessionStorage.getItem(getKey())
  if (fetched) {
    return JSON.parse(fetched).value
  } else {
    return {}
  }
}

export const set = newState => {
  const key = getKey()
  const value = JSON.stringify({ timestamp: Date.now(), value: newState })

  while (true) {
    try {
      sessionStorage.setItem(key, value)
      return
    } catch (error) {
      if (sessionStorage.length === 0) {
        console.error('An error occurred trying to save state history.')
        console.error(error)
        return
      } else {
        const oldestKV = _.flow(
          _.toPairs,
          _.filter(([k]) => _.startsWith('state-history-', k)),
          _.sortBy(([k, v]) => JSON.parse(v).timestamp),
          _.first
        )(sessionStorage)
        sessionStorage.removeItem(oldestKV[0])
      }
    }
  }
}

export const update = newState => { set({ ...get(), ...newState }) }

export const clearCurrent = () => set({})
