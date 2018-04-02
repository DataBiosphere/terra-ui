import _ from 'lodash'
import * as Config from 'src/libs/config'
import * as Utils from 'src/libs/utils'


let mockResponse
let noConnection

const consoleStyle = 'font-weight: bold; color: darkBlue'

window.saturnMock = {
  currently: function() {
    if (noConnection || mockResponse) {
      if (noConnection) {console.info('%cSimulating no connection', consoleStyle)}
      if (mockResponse) {
        console.info('%cSimulating response:', consoleStyle)
        console.info(mockResponse())
      }
    } else {
      console.info('%cNot mocking responses', consoleStyle)
    }
  },
  malformed: function() {
    mockResponse = () => new Response('{malformed', { status: 200 })
  },
  noConnection: function() {
    noConnection = true
  },
  off: function() {
    mockResponse = undefined
    noConnection = undefined
  },
  status: function(code) {
    mockResponse = () => new Response(new Blob([`Body of simulated ${code} response`]),
      { status: code })
  }
}

/**
 * @param {string} url
 * @param {object} [options]
 * @returns {Promise<Response>}
 */
export const ajax = function(url, options = { headers: {} }) {
  if (noConnection) {
    console.info('%cSimulating no connection', consoleStyle)
    return new Promise(function(resolve, reject) {
      reject(new TypeError('Simulating no connection'))
    })
  } else if (mockResponse) {
    console.info('%cSimulating response:', consoleStyle)
    console.info(mockResponse())
    return new Promise(function(resolve, reject) {
      resolve(mockResponse())
    })
  }

  let withAuth = options

  withAuth.headers = _.defaults({
    'Content-Type': 'application/json',
    'Authorization': 'bearer ' + Utils.getAuthToken()
  }, options.headers)

  return fetch(url, withAuth)
}


// Rawls

const rawls = function(path, success, failure, options) {
  ajax(`${Config.getRawlsUrlRoot()}/api/${path}`, options)
    .then(response => response.ok ? success(response) : response.text().then(failure))
    .catch(failure)
}

const rawlsJson = function(path, success, failure, options) {
  rawls(path, resp => resp.json().then(success), failure, options)
}

export const workspacesList = function(success, failure) {
  rawlsJson('workspaces', success, failure)
}

export const workspace = {
  details: function(namespace, name, success, failure) {
    rawlsJson(`workspaces/${namespace}/${name}`, success, failure)
  },
  entities: function(namespace, name, success, failure) {
    rawlsJson(`workspaces/${namespace}/${name}/entities`, success, failure)
  },
  entity: function(namespace, name, type, success, failure) {
    rawlsJson(`workspaces/${namespace}/${name}/entities/${type}`, success, failure)
  }
}


// Leo

const leo = function(path, success, failure, options) {
  ajax(`${Config.getLeoUrlRoot()}/${path}`, options)
    .then(response => response.ok ? success(response) : response.text().then(failure))
    .catch(failure)
}

export const clustersList = function(success, failure) {
  leo('api/clusters', resp => resp.json().then(success), failure)
}

export const cluster = {
  create: function(project, name, clusterOptions, success, failure) {
    leo(`api/cluster/${project}/${name}`, success, failure,
      { method: 'PUT', body: JSON.stringify(clusterOptions) })
  },
  delete: function(project, name, success, failure) {
    leo(`api/cluster/${project}/${name}`, success, failure, { method: 'DELETE' })
  }
}

export const setCookie = function(project, name, success, failure) {
  leo(`notebooks/${project}/${name}/setCookie`, success, failure, { credentials: 'include' })
}
