import { Component } from 'react'
import createHistory from 'history/createHashHistory'
import _ from 'lodash/fp'
import pathToRegexp from 'path-to-regexp'


export const history = createHistory({ hashType: 'noslash' })

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
export const findHandler = url => {
  const matchingHandlers = _.filter(({ regex }) => regex.test(url), allPathHandlers)
  console.assert(matchingHandlers.length <= 1, 'Multiple handlers matched', matchingHandlers)
  return matchingHandlers[0]
}

/**
 * @param {object} handler
 * @param {string} pathname
 * @returns {object} parsed props
 */
export const getHandlerProps = ({ keys, regex }, url) => {
  return _.zipObject(keys, _.tail(url.match(regex)))
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
  const [pathname, search] = getPath(...args).split('?')
  history.push({ pathname, search })
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
