import _ from 'lodash/fp'
import * as qs from 'qs'
import { getAuthToken } from 'src/libs/auth'
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

const authOpts = (token = getAuthToken()) => ({ headers: { Authorization: `Bearer ${token}` } })
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
    const scopes = [
      // need profile and email to use with Orch
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/devstorage.full_control'
    ]
    const res = await fetchOk(
      `${await Config.getSamUrlRoot()}/api/google/user/petServiceAccount/${namespace}/token`,
      _.mergeAll([authOpts(), jsonBody(scopes), { method: 'POST' }])
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
  getObject: async (bucket, object, namespace) => {
    return fetchOrchestration(`/api/storage/${bucket}/${object}`,
      authOpts(await Sam.token(namespace))).then(
      res => res.json()
    )
  },

  getObjectPreview: async (bucket, object, namespace) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}?alt=media`,
      _.merge(authOpts(await Sam.token(namespace)), { headers: { range: 'bytes=20000' } })).then(
      res => res.text()
    )
  },

  listNotebooks: async (namespace, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      authOpts(await Sam.token(namespace))
    )
    const { items } = await res.json()
    return _.filter(({ name }) => name.endsWith('.ipynb'), items)
  },

  notebook: (namespace, bucket, name) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    const copy = async newName => {
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}/copyTo/b/${bucket}/o/${nbName(newName)}`,
        _.merge(authOpts(await Sam.token(namespace)), { method: 'POST' })
      )
    }
    const doDelete = async () => {
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}`,
        _.merge(authOpts(await Sam.token(namespace)), { method: 'DELETE' })
      )
    }
    return {
      copy,

      create: async contents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${nbName(name)}`,
          _.merge(authOpts(await Sam.token(namespace)), {
            method: 'POST', body: JSON.stringify(contents),
            headers: { 'Content-Type': 'application/x-ipynb+json' }
          })
        )
      },

      delete: doDelete,

      rename: async newName => {
        await copy(newName)
        return doDelete()
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

  createWorkspace: async body => {
    const res = await fetchRawls('workspaces', _.mergeAll([authOpts(), jsonBody(body), { method: 'POST' }]))
    return res.json()
  },

  listGroups: async () => {
    const res = await fetchRawls('groups', authOpts())
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

      entityMetadata: async () => {
        const res = await fetchRawls(`${root}/entities`, authOpts())
        return res.json()
      },

      entitiesOfType: async type => {
        const res = await fetchRawls(`${root}/entities/${type}`, authOpts())
        return res.json()
      },

      paginatedEntitiesOfType: async (type, parameters) => {
        const res = await fetchRawls(`${root}/entityQuery/${type}?${qs.stringify(parameters)}`, authOpts())
        return res.json()
      },

      listMethodConfigs: async (allRepos = true) => {
        const res = await fetchRawls(`${mcPath}?allRepos=${allRepos}`, authOpts())
        return res.json()
      },

      importMethodConfigFromDocker: payload => {
        return fetchRawls(mcPath, _.mergeAll([authOpts(), jsonBody(payload), { method: 'POST' }]))
      },

      methodConfig: (configNamespace, configName) => {
        const path = `${mcPath}/${configNamespace}/${configName}`

        return {
          get: async () => {
            const res = await fetchRawls(path, authOpts())
            return res.json()
          },

          save: async payload => {
            const res = await fetchRawls(path, _.mergeAll([authOpts(), jsonBody(payload), { method: 'POST' }]))
            return res.json()
          },

          validate: async () => {
            const res = await fetchRawls(`${path}/validate`, authOpts())
            return res.json()
          },

          launch: async payload => {
            const res = await fetchRawls(`${root}/submissions`, _.mergeAll([
              authOpts(),
              jsonBody({
                ...payload,
                methodConfigurationNamespace: configNamespace,
                methodConfigurationName: configName
              }),
              { method: 'POST' }
            ]))
            return res.json()
          }
        }
      },

      delete: () => {
        return fetchRawls(root, _.merge(authOpts(), { method: 'DELETE' }))
      },

      clone: async body => {
        const res = await fetchRawls(`${root}/clone`, _.mergeAll([authOpts(), jsonBody(body), { method: 'POST' }]))
        return res.json()
      }
    }
  },

  methodConfigInputsOutputs: async loadedConfig => {
    const res = await fetchRawls('methodconfigs/inputsOutputs',
      _.mergeAll([authOpts(), jsonBody(loadedConfig.methodRepoMethod), { method: 'POST' }]))
    return res.json()
  }
}


const fetchLeo = async (path, ...args) => {
  return fetchOk(`${await Config.getLeoUrlRoot()}/${path}`, ...args)
}

export const Leo = {
  clustersList: async () => {
    const res = await fetchLeo('api/clusters?saturnAutoCreated=true', authOpts())
    return res.json()
  },

  cluster: (project, name) => {
    const root = `api/cluster/${project}/${name}`

    return {
      create: clusterOptions => {
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(clusterOptions), { method: 'PUT' }]))
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
          _.mergeAll([authOpts(), jsonBody(files), { method: 'POST' }]))
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


async function fetchOrchestration(path, ...args) {
  const urlRoot = await Config.getOrchestrationUrlRoot()
  return fetchOk(urlRoot + path, ...args)
}

export const Orchestration = {
  profile: {
    set: keysAndValues => {
      const blankProfile = {
        firstName: 'N/A',
        lastName: 'N/A',
        title: 'N/A',
        contactEmail: 'N/A',
        institute: 'N/A',
        institutionalProgram: 'N/A',
        programLocationCity: 'N/A',
        programLocationState: 'N/A',
        programLocationCountry: 'N/A',
        pi: 'N/A',
        nonProfitStatus: 'N/A'
      }
      return fetchOrchestration(
        '/register/profile',
        _.mergeAll([authOpts(), jsonBody(_.merge(blankProfile, keysAndValues)), { method: 'POST' }])
      )
    }
  },
  workspaces: (namespace, name) => {
    return {
      importBagit: bagitURL => {
        return fetchOrchestration(
          `/api/workspaces/${namespace}/${name}/importBagit`,
          _.mergeAll([authOpts(), jsonBody({ bagitURL, format: 'TSV' }), { method: 'POST' }])
        )
      }
    }
  }
}


export const Martha = {
  call: async url => {
    return fetchOk(await Config.getMarthaUrlRoot(),
      _.merge(jsonBody({ url, pattern: 'gs://' }), { method: 'POST' })
    ).then(res => res.text())
  }
}
