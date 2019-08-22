import _ from 'lodash/fp'
import * as qs from 'qs'
import { getUser } from 'src/libs/auth'
import * as Nav from 'src/libs/nav'


const getKey = () => {
  const state = window.history.state
  if (state && state.key) {
    return state.key
  } else {
    const key = `state-history-${Nav.history.location.pathname}-${getUser().id}`
    window.history.replaceState({ key }, '')
    return key
  }
}


export const get = () => {
  const key = getKey()
  const localFetched = localStorage.getItem(key)
  const sessionFetched = sessionStorage.getItem(key)

  if (localFetched || sessionFetched) {
    return _.merge(
      localFetched && JSON.parse(localFetched).value,
      sessionFetched && JSON.parse(sessionFetched).value
    )
  } else {
    return {}
  }
}

export const set = (newState, isSticky) => {
  const key = getKey()
  const value = JSON.stringify({ timestamp: Date.now(), value: newState })
  const storage = isSticky ? localStorage : sessionStorage

  while (true) {
    try {
      storage.setItem(key, value)
      return
    } catch (error) {
      if (storage.length === 0) {
        console.error('An error occurred trying to save state history.')
        console.error(error)
        return
      } else {
        const oldestKV = _.flow(
          _.toPairs,
          _.filter(([k]) => _.startsWith('state-history-', k)),
          _.sortBy(([k, v]) => JSON.parse(v).timestamp),
          _.first
        )(storage)
        storage.removeItem(oldestKV[0])
      }
    }
  }
}

export const update = (newState, isSticky) => { set({ ...get(), ...newState }, isSticky) }

export const clearCurrent = () => {
  set({})
  set({}, true)
}

export const setSearch = params => {
  // Note: setting undefined so that falsy values don't show up at all
  const newSearch = qs.stringify(_.mapValues(v => v || undefined, params), { addQueryPrefix: true })
  if (newSearch !== Nav.history.location.search) {
    Nav.history.replace({ search: newSearch })
  }
}
