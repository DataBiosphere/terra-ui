import _ from 'lodash/fp'
import uuid from 'uuid/v4'


const getKey = () => {
  const state = window.history.state
  if (state && state.key) {
    return state.key
  } else {
    const key = uuid()
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
        const oldest = _.flow(
          _.mapValues(JSON.parse),
          _.toPairs,
          _.sortBy(p => p[1].timestamp),
          _.first
        )(sessionStorage)
        sessionStorage.removeItem(oldest[0])
      }
    }
  }
}

export const update = newState => { set({ ...get(), ...newState }) }

export const clearCurrent = () => set({})
