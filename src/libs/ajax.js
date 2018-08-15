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
const appIdentifier = { headers: { 'X-App-ID': 'Saturn' } }
const addAppIdentifier = _.merge(appIdentifier)

const instrumentedFetch = (url, options) => {
  if (noConnection) {
    console.info('%cSimulating no connection', consoleStyle)
    return Promise.reject(new TypeError('Simulating no connection'))
  } else if (mockResponse) {
    console.info('%cSimulating response:', consoleStyle, mockResponse())
    return Promise.resolve(mockResponse())
  }
  return fetch(url, options)
}

const fetchOk = async (url, options) => {
  const res = await instrumentedFetch(url, options)
  return res.ok ? res : Promise.reject(res)
}


const fetchSam = async (path, options) => {
  return fetchOk(`${await Config.getSamUrlRoot()}/${path}`, addAppIdentifier(options))
}

const fetchBuckets = (path, options) => fetchOk(`https://www.googleapis.com/${path}`, options)
const nbName = name => encodeURIComponent(`notebooks/${name}.ipynb`)

const fetchRawls = async (path, options) => {
  return fetchOk(`${await Config.getRawlsUrlRoot()}/api/${path}`, addAppIdentifier(options))
}

const fetchLeo = async (path, options) => {
  return fetchOk(`${await Config.getLeoUrlRoot()}/${path}`, options)
}

const fetchDockstore = async (path, options) => {
  return fetchOk(`${await Config.getDockstoreUrlRoot()}/${path}`, options)
}
// %23 = '#', %2F = '/'
const dockstoreMethodPath = path => `api/ga4gh/v1/tools/%23workflow%2F${encodeURIComponent(path)}/versions`

const fetchAgora = async (path, options) => {
  return fetchOk(`${await Config.getAgoraUrlRoot()}/api/v1/${path}`, addAppIdentifier(options))
}

const fetchOrchestration = async (path, options) => {
  return fetchOk(`${await Config.getOrchestrationUrlRoot()}/${path}`, addAppIdentifier(options))
}


export const User = {
  token: Utils.memoizeWithTimeout(async namespace => {
    const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
    const res = await fetchSam(
      `api/google/user/petServiceAccount/${namespace}/token`,
      _.mergeAll([authOpts(), jsonBody(scopes), { method: 'POST' }])
    )
    return res.json()
  }, namespace => namespace, 1000 * 60 * 30),

  getStatus: async () => {
    return fetchSam('register/user/v2/self/info', authOpts())
  },

  create: async () => {
    const res = await fetchSam('register/user/v2/self', _.merge(authOpts(), { method: 'POST' }))
    return res.json()
  },

  profile: {
    get: async () => {
      const res = await fetchOrchestration('register/profile', authOpts())
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
        'register/profile',
        _.mergeAll([authOpts(), jsonBody(_.merge(blankProfile, keysAndValues)), { method: 'POST' }])
      )
    }
  },

  getProxyGroup: async email => {
    const res = await fetchOrchestration(`api/proxyGroup/${email}`, authOpts())
    return res.json()
  }
}


export const Groups = {
  list: async () => {
    const res = await fetchSam('api/groups/v1', authOpts())
    return res.json()
  },

  group: groupName => {
    const root = `api/groups/v1/${groupName}`

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

const attributesUpdateOps = _.flow(
  _.toPairs,
  _.flatMap(([k, v]) => {
    return _.isArray(v) ?
      [{ op: 'RemoveAttribute', attributeName: k }, ..._.map(x => ({ op: 'AddListMember', attributeListName: k, newMember: x }), v)] :
      [{ op: 'AddUpdateAttribute', attributeName: k, addUpdateAttribute: v }]
  })
)

export const Workspaces = {
  list: async () => {
    const res = await fetchRawls('workspaces', authOpts())
    return res.json()
  },

  create: async body => {
    const res = await fetchRawls('workspaces', _.mergeAll([authOpts(), jsonBody(body), { method: 'POST' }]))
    return res.json()
  },

  getShareLog: async () => {
    const res = await fetchOrchestration('api/sharelog/sharees?shareType=workspace', authOpts())
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

      getAcl: async () => {
        const res = await fetchRawls(`${root}/acl`, authOpts())
        return res.json()
      },

      updateAcl: async (aclUpdates, inviteNew=true) => {
        const res = await fetchRawls(`${root}/acl?inviteUsersNotFound=${inviteNew}`,
          _.mergeAll([authOpts(), jsonBody(aclUpdates), { method: 'PATCH' }]))
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
        const payload = attributesUpdateOps(attributesObject)
        return fetchRawls(root, _.mergeAll([authOpts(), jsonBody(payload), { method: 'PATCH' }]))
      },

      deleteAttributes: attributeNames => {
        const payload = _.map(attributeName => ({ op: 'RemoveAttribute', attributeName }), attributeNames)
        return fetchRawls(root, _.mergeAll([authOpts(), jsonBody(payload), { method: 'PATCH' }]))
      },

      importBagit: bagitURL => {
        return fetchOrchestration(
          `api/workspaces/${namespace}/${name}/importBagit`,
          _.mergeAll([authOpts(), jsonBody({ bagitURL, format: 'TSV' }), { method: 'POST' }])
        )
      },

      importEntities: async url => {
        const res = await fetch(url)
        const payload = await res.json()
        const body = _.map(({ name, entityType, attributes }) => {
          return { name, entityType, operations: attributesUpdateOps(attributes) }
        }, payload)
        return fetchRawls(`${root}/entities/batchUpsert`, _.mergeAll([authOpts(), jsonBody(body), { method: 'POST' }]))
      },

      storageCostEstimate: async () => {
        const res = await fetchOrchestration(`api/workspaces/${namespace}/${name}/storageCostEstimate`, authOpts())
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
      _.merge(authOpts(await User.token(namespace)), previewFull ? {} : { headers: { Range: 'bytes=0-20000' } }))
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
    const res = await fetchLeo('api/clusters?saturnAutoCreated=true', addAppIdentifier(authOpts()))
    return res.json()
  },

  cluster: (project, name) => {
    const root = `api/cluster/v2/${project}/${name}`

    return {
      create: async clusterOptions => {
        const body = _.merge(clusterOptions, {
          labels: { saturnAutoCreated: 'true', saturnVersion: version },
          defaultClientId: await Config.getGoogleClientId()
        })
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { method: 'PUT' }, appIdentifier]))
      },

      start: () => {
        return fetchLeo(`${root}/start`, _.mergeAll([authOpts(), { method: 'POST' }, appIdentifier]))
      },

      stop: () => {
        return fetchLeo(`${root}/stop`, _.mergeAll([authOpts(), { method: 'POST' }, appIdentifier]))
      },

      delete: () => {
        return fetchLeo(root, _.mergeAll([authOpts(), { method: 'DELETE' }, appIdentifier]))
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
  call: async uri => {
    return fetchOk(await Config.getMarthaUrlRoot(),
      _.mergeAll([jsonBody({ uri }), authOpts(), appIdentifier, { method: 'POST' }])
    ).then(res => res.json())
  }
}


export const Ajax = controller => {
  const signal = controller ? controller.signal : undefined

  return {
    workspaces: {
      list: async () => {
        const res = await fetchRawls('workspaces', _.merge({ signal }, authOpts()))
        return res.json()
      },

      workspace: (namespace, name) => {
        const root = `workspaces/${namespace}/${name}`

        return {
          listSubmissions: async () => {
            const res = await fetchRawls(`${root}/submissions`, _.merge({ signal }, authOpts()))
            return res.json()
          },

          storageCostEstimate: async () => {
            const res = await fetchOrchestration(`/api/workspaces/${namespace}/${name}/storageCostEstimate`, _.merge({ signal }, authOpts()))
            return res.json()
          }
        }
      }
    }
  }
}
