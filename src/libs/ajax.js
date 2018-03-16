import _ from 'lodash'
import * as Config from 'src/libs/config'
import * as Utils from 'src/libs/utils'


export const ajax = function(url, options = { headers: {} }) {
  _.defaults(options.headers, {
    'Content-Type': 'application/json',
    'Authorization': 'bearer ' + Utils.getAuthToken()
  })

  return fetch(url, options).then(response => response.json())
}

export const rawls = function(path, options) {
  return ajax(`${Config.getRawlsUrlRoot()}/api/${path}`, options)
}
