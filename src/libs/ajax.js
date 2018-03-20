import _ from 'lodash'
import * as Config from 'src/libs/config'
import * as Utils from 'src/libs/utils'


/**
 * @param {string} url
 * @param {object} [options]
 * @returns {Promise<json>}
 */
export const ajax = function(url, options = { headers: {} }) {
  let authedOptions = options

  authedOptions.headers = _.defaults({
    'Content-Type': 'application/json',
    'Authorization': 'bearer ' + Utils.getAuthToken()
  }, options.headers)

  return fetch(url, authedOptions)
}

/**
 * @param {string} path
 * @param {object} [options]
 * @returns {Promise<json>}
 */
export const rawls = function(path, options) {
  return ajax(`${Config.getRawlsUrlRoot()}/api/${path}`, options).then(response => response.json())
}

/**
 * @param {string} path
 * @param {object} [options]
 * @returns {Promise<json>}
 */
export const leo = function(path, options) {
  return ajax(`${Config.getLeoUrlRoot()}/${path}`, options)
}
