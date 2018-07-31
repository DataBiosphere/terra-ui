import _ from 'lodash/fp'
import * as qs from 'qs'
import { version } from 'src/data/clusters'
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

const fetchOk = async (...args) => {
  const res = await instrumentedFetch(...args)
  return res.ok ? res : Promise.reject(res)
}


const fetchSam = async (path, ...args) => {
  return fetchOk(`${await Config.getSamUrlRoot()}/api/${path}`, ...args)
}

const fetchBuckets = (path, ...args) => fetchOk(`https://www.googleapis.com/${path}`, ...args)
const nbName = name => encodeURIComponent(`notebooks/${name}.ipynb`)

const fetchRawls = async (path, ...args) => {
  return fetchOk(`${await Config.getRawlsUrlRoot()}/api/${path}`, ...args)
}

const fetchLeo = async (path, ...args) => {
  return fetchOk(`${await Config.getLeoUrlRoot()}/${path}`, ...args)
}

const fetchDockstore = async (path, ...args) => {
  return fetchOk(`${await Config.getDockstoreUrlRoot()}/${path}`, ...args)
}
// %23 = '#', %2F = '/'
const dockstoreMethodPath = path => `api/ga4gh/v1/tools/%23workflow%2F${encodeURIComponent(path)}/versions`

const fetchAgora = async (path, ...args) => {
  return fetchOk(`${await Config.getAgoraUrlRoot()}/api/v1/${path}`, ...args)
}

const fetchOrchestration = async (path, ...args) => {
  const urlRoot = await Config.getOrchestrationUrlRoot()
  return fetchOk(urlRoot + path, ...args)
}


export const User = {
  token: Utils.memoizeWithTimeout(async namespace => {
    const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
    const res = await fetchSam(
      `google/user/petServiceAccount/${namespace}/token`,
      _.mergeAll([authOpts(), jsonBody(scopes), { method: 'POST' }])
    )
    return res.json()
  }, namespace => namespace, 1000 * 60 * 30),

  getStatus: async () => {
    return instrumentedFetch(`${await Config.getSamUrlRoot()}/register/user`, authOpts())
  },

  create: async () => {
    const url = `${await Config.getSamUrlRoot()}/register/user`
    const res = await fetchOk(url, _.merge(authOpts(), { method: 'POST' }))
    return res.json()
  },

  profile: {
    get: async () => {
      const res = await fetchOrchestration('/register/profile', authOpts())
      return res.json()
    },
    set: keysAndValues => {
      const blankProfile = {
        firstName: 'N/A',
        lastName: 'N/A',
        title: 'N/A',
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

  getProxyGroup: async email => {
    const res = await fetchOrchestration(`/api/proxyGroup/${email}`, authOpts())
    return res.json()
  }
}


export const Groups = {
  list: async () => {
    const res = await fetchSam('groups/v1', authOpts())
    return res.json()
  },

  group: groupName => {
    const root = `groups/v1/${groupName}`

    const addMember = async (role, email) => {
      return fetchSam(`${root}/${role}/${email}`, _.merge(authOpts(), { method: 'PUT' }))
    }

    const removeMember = async (role, email) => {
      return fetchSam(`${root}/${role}/${email}`, _.merge(authOpts(), { method: 'DELETE' }))
    }

    return {
      create: () => {
        return fetchSam(root, _.merge(authOpts(), { method: 'POST' }))
      },

      delete: () => {
        return fetchSam(root, _.merge(authOpts(), { method: 'DELETE' }))
      },

      listMembers: async () => {
        const res = await fetchSam(`${root}/member`, authOpts())
        return res.json()
      },

      listAdmins: async () => {
        const res = await fetchSam(`${root}/admin`, authOpts())
        return res.json()
      },

      addMember,

      removeMember,

      changeMemberRole: async (email, oldRole, newRole) => {
        if (oldRole !== newRole) {
          await addMember(newRole, email)
          return removeMember(oldRole, email)
        }
      }
    }
  }
}


export const Billing = {
  listProjects: async () => {
    const res = await fetchRawls('user/billing', authOpts())
    return res.json()
  }
}


export const Workspaces = {
  list: async () => {
    const res = await fetchRawls('workspaces', authOpts())
    return res.json()
  },

  create: async body => {
    const res = await fetchRawls('workspaces', _.mergeAll([authOpts(), jsonBody(body), { method: 'POST' }]))
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

      listSubmissions: async () => {
        const res = await fetchRawls(`${root}/submissions`, authOpts())
        return res.json()
      },

      abortSubmission: async submissionId => {
        return fetchRawls(`${root}/submissions/${submissionId}`, _.merge(authOpts(), { method: 'DELETE' }))
      },

      delete: () => {
        return fetchRawls(root, _.merge(authOpts(), { method: 'DELETE' }))
      },

      clone: async body => {
        const res = await fetchRawls(`${root}/clone`, _.mergeAll([authOpts(), jsonBody(body), { method: 'POST' }]))
        return res.json()
      },

      shallowMergeNewAttributes: attributesObject => {
        const payload = _.flatMap(([k, v]) => {
          return _.isArray(v) ?
            [{ op: 'RemoveAttribute', attributeName: k }, ..._.map(x => ({ op: 'AddListMember', attributeListName: k, newMember: x }), v)] :
            { op: 'AddUpdateAttribute', attributeName: k, addUpdateAttribute: v }
        }, _.toPairs(attributesObject))

        return fetchRawls(root, _.mergeAll([authOpts(), jsonBody(payload), { method: 'PATCH' }]))
      },

      deleteAttributes: attributeNames => {
        const payload = _.map(attributeName => ({ op: 'RemoveAttribute', attributeName }), attributeNames)
        return fetchRawls(root, _.mergeAll([authOpts(), jsonBody(payload), { method: 'PATCH' }]))
      },

      importBagit: bagitURL => {
        return fetchOrchestration(
          `/api/workspaces/${namespace}/${name}/importBagit`,
          _.mergeAll([authOpts(), jsonBody({ bagitURL, format: 'TSV' }), { method: 'POST' }])
        )
      },

      storageCostEstimate: async () => {
        const res = await fetchOrchestration(`/api/workspaces/${namespace}/${name}/storageCostEstimate`, authOpts())
        return res.json()
      }
    }
  }
}


export const Buckets = {
  getObject: async (bucket, object, namespace) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}`,
      authOpts(await User.token(namespace))).then(
      res => res.json()
    )
  },

  getObjectPreview: async (bucket, object, namespace, previewFull = false) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}?alt=media`,
      _.merge(authOpts(await User.token(namespace)), previewFull ? {} : { headers: { range: 'bytes=20000' } }))
  },

  listNotebooks: async (namespace, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      authOpts(await User.token(namespace))
    )
    const { items } = await res.json()
    return _.filter(({ name }) => name.endsWith('.ipynb'), items)
  },

  notebook: (namespace, bucket, name) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    const copy = async newName => {
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}/copyTo/b/${bucket}/o/${nbName(newName)}`,
        _.merge(authOpts(await User.token(namespace)), { method: 'POST' })
      )
    }
    const doDelete = async () => {
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}`,
        _.merge(authOpts(await User.token(namespace)), { method: 'DELETE' })
      )
    }
    return {
      copy,

      create: async contents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${nbName(name)}`,
          _.merge(authOpts(await User.token(namespace)), {
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


export const Methods = {
  configInputsOutputs: async loadedConfig => {
    const res = await fetchRawls('methodconfigs/inputsOutputs',
      _.mergeAll([authOpts(), jsonBody(loadedConfig.methodRepoMethod), { method: 'POST' }]))
    return res.json()
  },

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


export const Jupyter = {
  clustersList: async () => {
    const res = await fetchLeo('api/clusters?saturnAutoCreated=true', authOpts())
    return res.json()
  },

  cluster: (project, name) => {
    const root = `api/cluster/${project}/${name}`

    return {
      create: clusterOptions => {
        const body = _.merge(clusterOptions, {
          labels: { saturnAutoCreated: 'true', saturnVersion: version }
        })
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { method: 'PUT' }]))
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


export const Martha = {
  call: async url => {
    return fetchOk(await Config.getMarthaUrlRoot(),
      _.merge(jsonBody({ url, pattern: 'gs://' }), { method: 'POST' })
    ).then(res => res.text())
  }
}
