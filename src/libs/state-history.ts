import _ from 'lodash/fp'
import { getDynamic, setDynamic } from 'src/libs/browser-storage'
import { v4 as uuid } from 'uuid'
import { BillingProjectUserRole } from "src/libs/ajax";


const getKey = () => {
  const state = window.history.state
  if (state?.key) {
    return state.key
  } else {
    const key = uuid()
    window.history.replaceState({ key }, '')
    return key
  }
}

export interface UserRolesEntry {
  email: string;
  roles: BillingProjectUserRole[];
}

export interface StoredState {
  projectUsers?: UserRolesEntry[]

  // define other stuff stored in here
}

export const get = (): StoredState => {
  const data = getDynamic(sessionStorage, getKey())
  return _.isPlainObject(data) ? data : {}
}

export const set = newState => {
  return setDynamic(sessionStorage, getKey(), newState)
}

export const update = newState => { set({ ...get(), ...newState }) }

export const clearCurrent = () => setDynamic(sessionStorage, getKey(), undefined)
