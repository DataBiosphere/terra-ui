import _ from 'lodash'
import * as Config from 'src/libs/config'
import * as Utils from 'src/libs/utils'


/**
 * @param {string} url
 * @param {object} [options]
 * @returns {Promise<json>}
 */
export const ajax = function(url, options = { headers: {} }) {
  _.defaults(options.headers, {
    'Content-Type': 'application/json',
    'Authorization': 'bearer ' + Utils.getAuthToken()
  })

  return fetch(url, options).then(response => response.json())
}

/**
 * @param {string} path
 * @param {object} [options]
 * @returns {Promise<json>}
 */
export const rawls = function(path, options) {
  return ajax(`${Config.getRawlsUrlRoot()}/api/${path}`, options)
}

/**
 * @param {string} path
 * @param {object} [options]
 * @returns {Promise<json>}
 */
export const leo = function(path, options) {
  return ajax(`${Config.getLeoUrlRoot()}/${path}`, options)
}
