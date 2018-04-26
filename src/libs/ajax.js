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
  token: Utils.memoizeWithTimeout((namespace) => {
    const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
    return fetchOk(`${Config.getSamUrlRoot()}/api/google/user/petServiceAccount/${namespace}/token`,
      _.merge(authOpts(), jsonBody(scopes), { method: 'POST' })
    )
      .then(parseJson)
  }, namespace => namespace, 1000 * 60 * 30),

  getUserStatus(success, failure) {
    this.json('register/user', success, failure)
  }
}


const fetchBuckets = (path, ...args) => fetchOk(`https://www.googleapis.com/${path}`, ...args)
const nbName = name => encodeURIComponent(`notebooks/${name}.ipynb`)

export const Buckets = {
  listNotebooks: (namespace, name) => {
    return Sam.token(namespace)
      .then(token => fetchBuckets(`storage/v1/b/${name}/o?prefix=notebooks/`, authOpts(token)))
      .then(parseJson)
      .then(({ items }) => _.filter(items, ({ name }) => name.endsWith('.ipynb')))
  },

  notebook: (namespace, bucket, name) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    return {
      copy: (newName) => {
        return Sam.token(namespace)
          .then(token => fetchBuckets(
            `${bucketUrl}/${nbName(name)}/copyTo/b/${bucket}/o/${nbName(newName)}`,
            _.merge(authOpts(token), { method: 'POST' }))
          )
      },

      create: (contents) => {
        return Sam.token(namespace)
          .then(token => fetchBuckets(
            `upload/${bucketUrl}?uploadType=media&name=${nbName(name)}`,
            _.merge(authOpts(token), {
              method: 'POST', body: JSON.stringify(contents),
              headers: { 'Content-Type': 'application/x-ipynb+json' }
            }))
          )
      },

      delete: () => {
        return Sam.token(namespace)
          .then(token => fetchBuckets(
            `${bucketUrl}/${nbName(name)}`,
            _.merge(authOpts(token), { method: 'DELETE' }))
          )
      },

      rename: (newName) => {
        return this.copy(newName).then(() => this.delete())
      }
    }
  }
}


const fetchRawls = (path, ...args) => fetchOk(`${Config.getRawlsUrlRoot()}/api/${path}`, ...args)

export const Rawls = {
  workspacesList: () => {
    return fetchRawls('workspaces', authOpts())
      .then(parseJson)
  },

  workspace: (namespace, name) => {
    const root = `workspaces/${namespace}/${name}`

    return {
      details: () => {
        return fetchRawls(root, authOpts())
          .then(parseJson)
      },

      entities: () => {
        return fetchRawls(`${root}/entities`, authOpts())
          .then(parseJson)
      },

      entity: (type) => {
        return fetchRawls(`${root}/entities/${type}`, authOpts())
          .then(parseJson)
      }
    }
  }
}


const fetchLeo = (path, ...args) => fetchOk(`${Config.getLeoUrlRoot()}/${path}`, ...args)

export const Leo = {
  clustersList: () => {
    return fetchLeo('api/clusters', authOpts())
      .then(parseJson)
  },

  cluster: (project, name) => {
    const root = `api/cluster/${project}/${name}`

    return {
      create: (clusterOptions) => {
        return fetchLeo(root, _.merge(authOpts(), jsonBody(clusterOptions), { method: 'PUT' }))
      },

      delete: () => {
        return fetchLeo(root, _.merge(authOpts(), { method: 'DELETE' }))
      }
    }
  },

  notebooks: (project, name) => {
    const root = `notebooks/${project}/${name}`

    return {
      localize: (files) => {
        return fetchLeo(`${root}/api/localize`,
          _.merge(authOpts(), jsonBody(files), { method: 'POST' }))
      },

      setCookie: () => {
        return fetchLeo(`${root}/setCookie`,
          _.merge(authOpts(), { credentials: 'include' }))
      }
    }
  }
}
