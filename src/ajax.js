import update from 'immutability-helper'
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
  return ajax(`https://rawls.dsde-dev.broadinstitute.org/api/${path}`, options)
}

export { ajax, rawls }
