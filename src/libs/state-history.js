import _ from 'lodash'


export const set = newState => { window.history.replaceState(newState, '') }

export const get = () => window.history.state

export const update = newState => { set(_.defaults(newState, get())) }
