import _ from 'lodash'
import * as Config from 'src/libs/config'
import * as Utils from 'src/libs/utils'


let mockResponse
let noConnection

const consoleStyle = 'font-weight: bold; color: darkBlue'

window.saturnMock = {
  currently: function() {
    if (noConnection || mockResponse) {
      if (noConnection) { console.info('%cSimulating no connection', consoleStyle) }
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


export const Sam = {
  token: Utils.memoizeWithTimeout(async namespace => {
    const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
    const res = await fetchOk(
      `${await Config.getSamUrlRoot()}/api/google/user/petServiceAccount/${namespace}/token`,
      _.merge(authOpts(), jsonBody(scopes), { method: 'POST' })
    )
    return res.json()
  }, namespace => namespace, 1000 * 60 * 30),

  getUserStatus: async () => {
    return instrumentedFetch(`${await Config.getSamUrlRoot()}/register/user`, authOpts())
  },

  createUser: async () => {
    const url = `${await Config.getSamUrlRoot()}/register/user`
    const res = await fetchOk(url, _.merge(authOpts(), { method: 'POST' }))
    return res.json()
  }
}


const fetchBuckets = (path, ...args) => fetchOk(`https://www.googleapis.com/${path}`, ...args)
const nbName = name => encodeURIComponent(`notebooks/${name}.ipynb`)

export const Buckets = {
  listNotebooks: async (namespace, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      authOpts(await Sam.token(namespace))
    )
    const { items } = await res.json()
    return _.filter(items, ({ name }) => name.endsWith('.ipynb'))
  },

  notebook: (namespace, bucket, name) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    return {
      copy: async newName => {
        return fetchBuckets(
          `${bucketUrl}/${nbName(name)}/copyTo/b/${bucket}/o/${nbName(newName)}`,
          _.merge(authOpts(await Sam.token(namespace)), { method: 'POST' })
        )
      },

      create: async contents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${nbName(name)}`,
          _.merge(authOpts(await Sam.token(namespace)), {
            method: 'POST', body: JSON.stringify(contents),
            headers: { 'Content-Type': 'application/x-ipynb+json' }
          })
        )
      },

      delete: async () => {
        return fetchBuckets(
          `${bucketUrl}/${nbName(name)}`,
          _.merge(authOpts(await Sam.token(namespace)), { method: 'DELETE' })
        )
      },

      rename: async newName => {
        await this.copy(newName)
        return this.delete()
      }
    }
  }
}


const fetchRawls = async (path, ...args) => {
  return fetchOk(`${await Config.getRawlsUrlRoot()}/api/${path}`, ...args)
}

export const Rawls = {
  listBillingProjects: async () => {
    const res = await fetchRawls('user/billing', authOpts())
    return res.json()
  },

  workspacesList: async () => {
    const res = await fetchRawls('workspaces', authOpts())
    return res.json()
  },

  workspace: (namespace, name) => {
    const root = `workspaces/${namespace}/${name}`
    const mcPath = `${root}/methodconfigs`

    return {
      details: async () => {
        const res = await fetchRawls(root, authOpts())
        return res.json()
      },

      entities: async () => {
        const res = await fetchRawls(`${root}/entities`, authOpts())
        return res.json()
      },

      entity: async type => {
        const res = await fetchRawls(`${root}/entities/${type}`, authOpts())
        return res.json()
      },

      methodConfigs: {
        list: async (allRepos = true) => {
          const res = await fetchRawls(`${mcPath}?allRepos=${allRepos}`, authOpts())
          return res.json()
        },

        importFromDocker: payload => {
          return fetchRawls(mcPath, _.merge(authOpts(), jsonBody(payload), { method: 'POST' }))
        },

        get: async (configNamespace, configName) => {
          const res = await fetchRawls(`${mcPath}/${configNamespace}/${configName}`, authOpts())
          return res.json()
        }
      }
    }
  },

  methodConfigInputsOutputs: async loadedConfig => {
    const res = await fetchRawls('methodconfigs/inputsOutputs',
      _.merge(authOpts(), jsonBody(loadedConfig.methodRepoMethod), { method: 'POST' }))
    return res.json()
  }
}


const fetchLeo = async (path, ...args) => {
  return fetchOk(`${await Config.getLeoUrlRoot()}/${path}`, ...args)
}

export const Leo = {
  clustersList: async () => {
    const res = await fetchLeo('api/clusters', authOpts())
    return res.json()
  },

  cluster: (project, name) => {
    const root = `api/cluster/${project}/${name}`

    return {
      create: clusterOptions => {
        return fetchLeo(root, _.merge(authOpts(), jsonBody(clusterOptions), { method: 'PUT' }))
      },

      start: () => {
        return fetchLeo(`${root}/start`, _.merge(authOpts(), { method: 'POST' }))
      },

      stop: () => {
        return fetchLeo(`${root}/stop`, _.merge(authOpts(), { method: 'POST' }))
      },

      delete: () => {
        return fetchLeo(root, _.merge(authOpts(), { method: 'DELETE' }))
      }
    }
  },

  notebooks: (project, name) => {
    const root = `notebooks/${project}/${name}`

    return {
      localize: files => {
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


const fetchDockstore = async (path, ...args) => {
  return fetchOk(`${await Config.getDockstoreUrlRoot()}/${path}`, ...args)
}
// %23 = '#', %2F = '/'
const dockstoreMethodPath = path => `api/ga4gh/v1/tools/%23workflow%2F${encodeURIComponent(path)}/versions`

export const Dockstore = {
  getWdl: async (path, version) => {
    const res = await fetchDockstore(`${dockstoreMethodPath(path)}/${encodeURIComponent(version)}/WDL/descriptor`)
    return res.json()
  },

  getVersions: async path => {
    const res = await fetchDockstore(dockstoreMethodPath(path))
    return res.json()
  }

}


const fetchAgora = async (path, ...args) => {
  return fetchOk(`${await Config.getAgoraUrlRoot()}/api/v1/${path}`, ...args)
}

export const Agora = {
  method: (namespace, name, snapshotId) => {
    const root = `methods/${namespace}/${name}/${snapshotId}`

    return {
      get: async () => {
        const res = await fetchAgora(root, authOpts())
        return res.json()
      }
    }
  }
}


export const Orchestration = {
  profile: {
    set: async keysAndValues => {
      const url = `${await Config.getOrchestrationUrlRoot()}/register/profile`
      return fetchOk(url, _.merge(authOpts(), jsonBody(keysAndValues), { method: 'POST' })
      )
    }
  }
}
