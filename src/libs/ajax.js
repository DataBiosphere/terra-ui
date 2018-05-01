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

const parseJson = res => res.json()
const authOpts = (token = Utils.getAuthToken()) => ({ headers: { Authorization: `Bearer ${token}` } })
const jsonBody = body => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

const instrumentedFetch = (...args) => {
  if (noConnection) {
    console.info('%cSimulating no connection', consoleStyle)
    return Promise.reject(new TypeError('Simulating no connection'))
  } else if (mockResponse) {
    console.info('%cSimulating response:', consoleStyle, mockResponse())
    return Promise.resolve(mockResponse())
  }
  return fetch(...args)
}

const fetchOk = (...args) => {
  return instrumentedFetch(...args)
    .then(res => res.ok ? res : res.text().then(text => Promise.reject(text)))
}


const Sam = {
  token: (namespace) => {
    const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
    return fetchOk(`${Config.getSamUrlRoot()}/api/google/user/petServiceAccount/${namespace}/token`,
      _.merge(authOpts(), jsonBody(scopes), { method: 'POST' })
    )
      .then(parseJson)
  }
}


const fetchBuckets = (path, ...args) => fetchOk(`https://www.googleapis.com/${path}`, ...args)
const nbName = name => `notebooks/${name}.ipynb`

export const Buckets = {
  copyNotebook: (namespace, bucket, oldName, newName) => {
    return Sam.token(namespace)
      .then(token => fetchBuckets(
        `storage/v1/b/${bucket}/o/${nbName(oldName)}/copyTo/b/${bucket}/o/${nbName(newName)}`,
        _.merge(authOpts(token), { method: 'POST' }))
      )
  },

  createNotebook: (namespace, bucket, name, contents) => {
    return Sam.token(namespace)
      .then(token => fetchBuckets(
        `upload/storage/v1/b/${bucket}/o?uploadType=media&name=${nbName(name)}`,
        _.merge(authOpts(token), { method: 'POST', body: JSON.stringify(contents),
                                   headers: { 'Content-Type': 'application/x-ipynb+json' } }))
      )
  },

  deleteNotebook: (namespace, bucket, name) => {
    return Sam.token(namespace)
      .then(token => fetchBuckets(
        `storage/v1/b/${bucket}/o/${nbName(name)}`,
        _.merge(authOpts(token), { method: 'DELETE' }))
      )
  },

  renameNotebook: (namespace, bucket, oldName, newName) => {
    return Buckets.copyNotebook(namespace, bucket, oldName, newName)
      .then(() => Buckets.deleteNotebook(namespace, bucket, oldName))
  },

  listNotebooks: (namespace, name) => {
    return Sam.token(namespace)
      .then(token => fetchBuckets(`storage/v1/b/${name}/o?prefix=notebooks/`, authOpts(token)))
      .then(parseJson)
      .then(({ items }) => _.filter(items, ({ name }) => name.endsWith('.ipynb')))
  }
}


const fetchRawls = (path, ...args) => fetchOk(`${Config.getRawlsUrlRoot()}/api/${path}`, ...args)

export const Rawls = {
  workspacesList: () => {
    return fetchRawls('workspaces', authOpts())
      .then(parseJson)
  },

  workspaceDetails: (namespace, name) => {
    return fetchRawls(`workspaces/${namespace}/${name}`, authOpts())
      .then(parseJson)
  },

  workspaceEntities: (namespace, name) => {
    return fetchRawls(`workspaces/${namespace}/${name}/entities`, authOpts())
      .then(parseJson)
  },

  workspaceEntity: (namespace, name, type) => {
    return fetchRawls(`workspaces/${namespace}/${name}/entities/${type}`, authOpts())
      .then(parseJson)
  }
}


const fetchLeo = (path, ...args) => fetchOk(`${Config.getLeoUrlRoot()}/${path}`, ...args)

export const Leo = {
  clustersList: () => {
    return fetchLeo('api/clusters', authOpts())
      .then(parseJson)
  },

  clusterCreate: (project, name, clusterOptions) => {
    return fetchLeo(`api/cluster/${project}/${name}`, _.merge(authOpts(), jsonBody(clusterOptions), { method: 'PUT' }))
  },

  clusterDelete: (project, name) => {
    return fetchLeo(`api/cluster/${project}/${name}`, _.merge(authOpts(), { method: 'DELETE' }))
  },

  localizeNotebooks: (project, name, files) => {
    return fetchLeo(`notebooks/${project}/${name}/api/localize`, _.merge(authOpts(), jsonBody(files), { method: 'POST' }))
  },

  setCookie: (project, name) => {
    return fetchLeo(`notebooks/${project}/${name}/setCookie`, _.merge(authOpts(), { credentials: 'include' }))
  }
}
