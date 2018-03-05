import update from 'immutability-helper'
import * as Config from './components/config'
import * as utils from './utils'


const ajax = function(url, options = { headers: {} }) {
  options.headers = update({
      'Content-Type': 'application/json',
      'Authorization': 'bearer ' + utils.getAuthToken()
    },
    { $merge: options.headers })

  return fetch(url, options).then(response => response.json())
}

const rawls = function(path, options) {
  return ajax(`${Config.getRawlsUrlRoot()}/api/${path}`, options)
}

export { ajax, rawls }
