import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { initialState, reducers } from 'src/reducers'


const loggerMiddleware = store => next => action => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`%caction`, 'color: #0f6db7', action)
  }
  const result = next(action)
  window.state = store.getState()
  return result
}

export const reducer = (state = initialState, action) => {
  const fn = reducers[action.type]
  return fn ? fn(state, action) : state
}

const store = createStore(reducer, applyMiddleware(thunkMiddleware, loggerMiddleware))
window.store = store

export default store
