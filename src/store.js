import { Record } from 'immutable'
import { createStore, applyMiddleware } from 'redux'

const initialState = new (Record({
  workspaces: new (Record({
    filter: '',
    listView: false,
    itemsPerPage: 6,
    pageNumber: 1,
    workspaces: null,
    failure: undefined,
  }))()
}))()

const funcMiddleware = ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
    if (action.thunk) {
      return action(dispatch, getState)
    }
    return next({ type: 'update', fn: action })
  }
  return next(action)
}

const reducer = (state = initialState, action) => {
  return action.type === 'update' ? action.fn(state) : state
}

const store = createStore(reducer, applyMiddleware(funcMiddleware))
window.store = store

export default store
