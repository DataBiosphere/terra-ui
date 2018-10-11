import createHistory from 'history/createHashHistory'
import _ from 'lodash/fp'
import pathToRegexp from 'path-to-regexp'
import * as qs from 'qs'
import { Component } from 'react'
import { atom } from 'src/libs/utils'


export const blockNav = atom(() => Promise.resolve())

export const history = createHistory({
  hashType: 'noslash',
  getUserConfirmation: (_, cb) => blockNav.get()().then(() => cb(true))
})

history.block('')

let allPathHandlers = {}

/**
 * @param {string} k - key for path
 * @param {object} handler
 * @param {string} handler.path - path spec handled by path-to-regexp
 * @param handler.component - component to render
 */
export const defPath = (k, { path, component, ...data }) => {
  console.assert(!_.has(k, allPathHandlers), `Key ${k} is already defined`)
  const keys = [] // mutated by pathToRegexp
  const regex = pathToRegexp(path, keys)
  allPathHandlers[k] = {
    regex,
    component,
    keys: _.map('name', keys),
    makePath: pathToRegexp.compile(path),
    ...data
  }
}

export const clearPaths = function() {
  allPathHandlers = {}
}

/**
 * @param {string} pathname
 * @returns {object} matchingHandler
 */
export const findHandler = pathname => {
  const matchingHandlers = _.filter(({ regex }) => regex.test(pathname), allPathHandlers)
  console.assert(matchingHandlers.length <= 1, 'Multiple handlers matched', matchingHandlers)
  return matchingHandlers[0]
}

/**
 * @param {object} handler
 * @param {string} pathname
 * @param {string} search
 * @returns {object} parsed props
 */
export const getHandlerProps = ({ keys, regex }, pathname, search) => {
  const pathProps = _.zipObject(keys, _.tail(pathname.match(regex)))
  return {
    ...pathProps,
    queryParams: qs.parse(search, { ignoreQueryPrefix: true, plainObjects: true })
  }
}

/**
 * @param k
 * @param params
 * @returns {string}
 */
export const getPath = (k, params) => {
  const handler = allPathHandlers[k]
  console.assert(handler,
    `No handler found for key ${k}. Valid path keys are: ${_.keysIn(allPathHandlers)}`)
  return handler.makePath(params)
}

/**
 * @param args
 * @returns {string}
 */
export const getLink = (...args) => `#${getPath(...args).slice(1)}` // slice off leading slash

/**
 * @param args
 */
export const goToPath = (...args) => {
  history.push({ pathname: getPath(...args) })
}

export class Redirector extends Component {
  componentDidMount() {
    const { pathname, search } = this.props
    history.replace({ pathname, search })
  }

  render() {
    return null
  }
}
