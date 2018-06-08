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


export const get = () => JSON.parse(sessionStorage.getItem(getKey())) || {}

export const set = newState => sessionStorage.setItem(getKey(), JSON.stringify(newState))

export const update = newState => { set({ ...get(), ...newState }) }

export const clearCurrent = () => set({})
