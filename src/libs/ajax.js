import _ from 'underscore'
import * as Config from 'src/libs/config'
import * as Utils from 'src/libs/utils'


const ajax = function(url, options = { headers: {} }) {
  options.headers = _.extend({
      'Content-Type': 'application/json',
      'Authorization': 'bearer ' + Utils.getAuthToken()
    },
    options.headers)

  return fetch(url, options).then(response => response.json())
}

const rawls = function(path, options) {
  return ajax(`${Config.getRawlsUrlRoot()}/api/${path}`, options)
}

export { ajax, rawls }
