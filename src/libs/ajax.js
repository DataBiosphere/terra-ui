import _ from 'lodash'
import * as Config from 'src/libs/config'
import * as Utils from 'src/libs/utils'


/**
 * @param {string} url
 * @param {object} [options]
 * @returns {Promise<Response>}
 */
export const ajax = function(url, options = { headers: {} }) {
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

export const workspaceList = function(success, failure) {
  rawlsJson('workspaces', success, failure)
}

export const workspaceDetails = function(namespace, name, success, failure) {
  rawlsJson(`workspaces/${namespace}/${name}`, success, failure)
}

export const workspaceEntities = function(namespace, name, success, failure) {
  rawlsJson(`workspaces/${namespace}/${name}/entities`, success, failure)
}

export const workspaceEntity = function(namespace, name, type, success, failure) {
  rawlsJson(`workspaces/${namespace}/${name}/entities/${type}`, success, failure)
}


// Leo

const leo = function(path, success, failure, options) {
  ajax(`${Config.getLeoUrlRoot()}/${path}`, options)
    .then(response => response.ok ? success(response) : response.text().then(failure))
    .catch(failure)
}

export const clusterList = function(success, failure) {
  leo('api/clusters', resp => resp.json().then(success), failure)
}

export const setCookie = function(project, name, success, failure) {
  leo(`notebooks/${project}/${name}/setCookie`, success, failure, { credentials: 'include' })
}

export const makeCluster = function(project, name, clusterOptions, success, failure) {
  leo(`api/cluster/${project}/${name}`, success, failure,
    { method: 'PUT', body: JSON.stringify(clusterOptions) })
}

export const deleteCluster = function(project, name, success, failure) {
  leo(`api/cluster/${project}/${name}`, success, failure, { method: 'DELETE' })
}
