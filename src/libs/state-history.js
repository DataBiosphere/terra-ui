export const set = newState => { window.history.replaceState(newState, '') }

export const get = () => window.history.state || {}

export const update = newState => { set({ ...get(), ...newState }) }

export const clearCurrent = () => set({})
