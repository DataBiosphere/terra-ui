import _ from 'lodash/fp'
import * as qs from 'qs'
import { h } from 'react-hyperscript-helpers'
import { version } from 'src/data/clusters'
import { getUser } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


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

const authOpts = (token = getUser().token) => ({ headers: { Authorization: `Bearer ${token}` } })
const jsonBody = body => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
const appIdentifier = { headers: { 'X-App-ID': 'Saturn' } }
const addAppIdentifier = _.merge(appIdentifier)
const tosData = { appid: 'Saturn', tosversion: 1 }

const instrumentedFetch = (url, options) => {
  if (noConnection) {
    console.info('%cSimulating no connection', consoleStyle)
    return Promise.reject(new TypeError('Simulating no connection'))
  } else if (mockResponse) {
    console.info('%cSimulating response:', consoleStyle, mockResponse())
    return Promise.resolve(mockResponse())
  }

  return new Promise((resolve, reject) => {
    fetch(url, options).then(resolve, error => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // no-op, this is from an aborted call
      } else {
        reject(error)
      }
    })
  })
}


const fetchOk = async (url, options) => {
  const res = await instrumentedFetch(url, options)
  return res.ok ? res : Promise.reject(res)
}


const fetchSam = async (path, options) => {
  return fetchOk(`${getConfig().samUrlRoot}/${path}`, addAppIdentifier(options))
}

const fetchBuckets = (path, options) => fetchOk(`https://www.googleapis.com/${path}`, options)
const nbName = name => encodeURIComponent(`notebooks/${name}.ipynb`)

const fetchRawls = async (path, options) => {
  return fetchOk(`${getConfig().rawlsUrlRoot}/api/${path}`, addAppIdentifier(options))
}

const fetchLeo = async (path, options) => {
  return fetchOk(`${getConfig().leoUrlRoot}/${path}`, options)
}

const fetchDockstore = async (path, options) => {
  return fetchOk(`${getConfig().dockstoreUrlRoot}/${path}`, options)
}
// %23 = '#', %2F = '/'
const dockstoreMethodPath = path => `api/ga4gh/v1/tools/%23workflow%2F${encodeURIComponent(path)}/versions`

const fetchAgora = async (path, options) => {
  return fetchOk(`${getConfig().agoraUrlRoot}/api/v1/${path}`, addAppIdentifier(options))
}

const fetchOrchestration = async (path, options) => {
  return fetchOk(`${getConfig().orchestrationUrlRoot}/${path}`, addAppIdentifier(options))
}

const fetchRex = async (path, options) => {
  return fetchOk(`${getConfig().rexUrlRoot}/api/npsResponses/${path}`, options)
}


const User = signal => ({
  token: Utils.memoizeWithTimeout(async namespace => {
    const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
    const res = await fetchSam(
      `api/google/user/petServiceAccount/${namespace}/token`,
      _.mergeAll([authOpts(), jsonBody(scopes), { signal, method: 'POST' }])
    )
    return res.json()
  }, namespace => namespace, 1000 * 60 * 30),

  getStatus: async () => {
    return instrumentedFetch(`${getConfig().samUrlRoot}/register/user/v2/self/info`, _.mergeAll([authOpts(), { signal }, appIdentifier]))
  },

  create: async () => {
    const res = await fetchSam('register/user/v2/self', _.merge(authOpts(), { signal, method: 'POST' }))
    return res.json()
  },

  profile: {
    get: async () => {
      const res = await fetchOrchestration('register/profile', _.merge(authOpts(), { signal }))
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
        _.mergeAll([authOpts(), jsonBody(_.merge(blankProfile, keysAndValues)), { signal, method: 'POST' }])
      )
    }
  },

  getProxyGroup: async email => {
    const res = await fetchOrchestration(`api/proxyGroup/${email}`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  getTosAccepted: async () => {
    const url = `${getConfig().tosUrlRoot}/user/response?${qs.stringify(tosData)}`
    const res = await instrumentedFetch(url, _.merge(authOpts(), { signal }))
    if (res.status === 403 || res.status === 404) {
      return false
    }
    if (!res.ok) {
      throw res
    }
    const { accepted } = await res.json()
    return accepted
  },

  acceptTos: async () => {
    await fetchOk(
      `${getConfig().tosUrlRoot}/user/response`,
      _.mergeAll([authOpts(), { signal, method: 'POST' }, jsonBody({ ...tosData, accepted: true })])
    )
  },

  // If you are making changes to the Support Request Modal, make sure you test the following:
  // 1. Submit a ticket via Terra while signed in and signed out
  // 2. Check the tickets are generated on Zendesk
  // 3. Reply internally (as a Light Agent) and make sure an email is not sent
  // 4. Reply externally (ask one of the Comms team with Full Agent access) and make sure you receive an email
  createSupportRequest: async ({ name, email, currUrl, subject, type, description, attachmentToken }) => {
    return fetchOk(
      `https://broadinstitute.zendesk.com/api/v2/requests.json`,
      _.merge({ signal, method: 'POST' }, jsonBody({
        request: {
          requester: { name, email },
          subject,
          // BEWARE changing the following ids or values! If you change them then you must thoroughly test.
          'custom_fields': [
            { id: 360012744452, value: type },
            { id: 360007369412, value: description },
            { id: 360012744292, value: name },
            { id: 360012782111, value: email }
          ],
          comment: {
            body: `${description}\n\n------------------\nSubmitted from: ${currUrl}`,
            uploads: [`${attachmentToken}`]
          }
        }
      })))
  },

  uploadAttachment: async file => {
    const res = await fetch(`https://broadinstitute.zendesk.com/api/v2/uploads?filename=${file.name}`, {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': 'application/binary'
      }
    })
    return (await res.json()).upload
  },

  lastNpsResponse: async () => {
    const res = await fetchRex('lastTimestamp', _.merge(authOpts(), { signal }))
    return res.json()
  },

  postNpsResponse: async body => {
    return fetchRex('create', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
  }
})

const Groups = signal => ({
  // TODO: Replace when switching back to SAM for groups api
  list: async () => {
    const res = await fetchOrchestration('api/groups', _.merge(authOpts(), { signal }))
    return res.json()
  },

  group: groupName => {
    const root = `api/groups/${groupName}`

    const addMember = async (role, email) => {
      return fetchOrchestration(`${root}/${role}/${email}`, _.merge(authOpts(), { signal, method: 'PUT' }))
    }

    const removeMember = async (role, email) => {
      return fetchOrchestration(`${root}/${role}/${email}`, _.merge(authOpts(), { signal, method: 'DELETE' }))
    }

    return {
      create: () => {
        return fetchOrchestration(root, _.merge(authOpts(), { signal, method: 'POST' }))
      },

      delete: () => {
        return fetchOrchestration(root, _.merge(authOpts(), { signal, method: 'DELETE' }))
      },

      listMembers: async () => {
        const res = await fetchOrchestration(`${root}`, _.merge(authOpts(), { signal }))
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
})


const Billing = signal => ({
  listProjects: async () => {
    const res = await fetchRawls('user/billing', _.merge(authOpts(), { signal }))
    return res.json()
  },
  listProjectsExtended: async () => {
    const res = await fetchSam('api/resources/v1/billing-project', _.merge(authOpts(), { signal }))
    return res.json()
  }
})

const attributesUpdateOps = _.flow(
  _.toPairs,
  _.flatMap(([k, v]) => {
    return _.isArray(v) ?
      [{ op: 'RemoveAttribute', attributeName: k }, ..._.map(x => ({ op: 'AddListMember', attributeListName: k, newMember: x }), v)] :
      [{ op: 'AddUpdateAttribute', attributeName: k, addUpdateAttribute: v }]
  })
)

const Workspaces = signal => ({
  list: async () => {
    const res = await fetchRawls('workspaces', _.merge(authOpts(), { signal }))
    return res.json()
  },

  create: async body => {
    const res = await fetchRawls('workspaces', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
    return res.json()
  },

  getShareLog: async () => {
    const res = await fetchOrchestration('api/sharelog/sharees?shareType=workspace', _.merge(authOpts(), { signal }))
    return res.json()
  },

  workspace: (namespace, name) => {
    const root = `workspaces/${namespace}/${name}`
    const mcPath = `${root}/methodconfigs`

    return {
      details: async () => {
        const res = await fetchRawls(root, _.merge(authOpts(), { signal }))
        return res.json()
      },

      getAcl: async () => {
        const res = await fetchRawls(`${root}/acl`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      updateAcl: async (aclUpdates, inviteNew = true) => {
        const res = await fetchRawls(`${root}/acl?inviteUsersNotFound=${inviteNew}`,
          _.mergeAll([authOpts(), jsonBody(aclUpdates), { signal, method: 'PATCH' }]))
        return res.json()
      },

      entityMetadata: async () => {
        const res = await fetchRawls(`${root}/entities`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      createEntity: async payload => {
        const res = await fetchRawls(`${root}/entities`, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]))
        return res.json()
      },

      entitiesOfType: async type => {
        const res = await fetchRawls(`${root}/entities/${type}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      paginatedEntitiesOfType: async (type, parameters) => {
        const res = await fetchRawls(`${root}/entityQuery/${type}?${qs.stringify(parameters)}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      listMethodConfigs: async (allRepos = true) => {
        const res = await fetchRawls(`${mcPath}?allRepos=${allRepos}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      importMethodConfigFromDocker: payload => {
        return fetchRawls(mcPath, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]))
      },

      methodConfig: (configNamespace, configName) => {
        const path = `${mcPath}/${configNamespace}/${configName}`

        return {
          get: async () => {
            const res = await fetchRawls(path, _.merge(authOpts(), { signal }))
            return res.json()
          },

          save: async payload => {
            const res = await fetchRawls(path, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]))
            return res.json()
          },

          copyTo: async ({ destConfigNamespace, destConfigName, workspaceName }) => {
            const payload = {
              source: { namespace: configNamespace, name: configName, workspaceName: { namespace, name } },
              destination: { namespace: destConfigNamespace, name: destConfigName, workspaceName }
            }
            const res = await fetchRawls('methodconfigs/copy', _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]))
            return res.json()
          },

          validate: async () => {
            const res = await fetchRawls(`${path}/validate`, _.merge(authOpts(), { signal }))
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
              { signal, method: 'POST' }
            ]))
            return res.json()
          },

          delete: () => {
            return fetchRawls(path, _.merge(authOpts(), { signal, method: 'DELETE' }))
          }
        }
      },

      listSubmissions: async () => {
        const res = await fetchRawls(`${root}/submissions`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      submission: submissionId => {
        const submissionPath = `${root}/submissions/${submissionId}`

        return {
          get: async () => {
            const res = await fetchRawls(submissionPath, _.merge(authOpts(), { signal }))
            return res.json()
          },

          abort: async () => {
            return fetchRawls(submissionPath, _.merge(authOpts(), { signal, method: 'DELETE' }))
          }
        }
      },

      delete: () => {
        return fetchRawls(root, _.merge(authOpts(), { signal, method: 'DELETE' }))
      },

      clone: async body => {
        const res = await fetchRawls(`${root}/clone`, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
        return res.json()
      },

      shallowMergeNewAttributes: attributesObject => {
        const payload = attributesUpdateOps(attributesObject)
        return fetchRawls(root, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'PATCH' }]))
      },

      deleteAttributes: attributeNames => {
        const payload = _.map(attributeName => ({ op: 'RemoveAttribute', attributeName }), attributeNames)
        return fetchRawls(root, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'PATCH' }]))
      },

      importBagit: bagitURL => {
        return fetchOrchestration(
          `api/workspaces/${namespace}/${name}/importBagit`,
          _.mergeAll([authOpts(), jsonBody({ bagitURL, format: 'TSV' }), { signal, method: 'POST' }])
        )
      },

      importEntities: async url => {
        const res = await fetch(url)
        const payload = await res.json()
        const body = _.map(({ name, entityType, attributes }) => {
          return { name, entityType, operations: attributesUpdateOps(attributes) }
        }, payload)
        return fetchRawls(`${root}/entities/batchUpsert`, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
      },

      importEntitiesFile: async file => {
        const formData = new FormData()
        formData.set('entities', file)
        return fetchOrchestration(`api/${root}/flexibleImportEntities`, _.merge(authOpts(), { body: formData, signal, method: 'POST' }))
      },

      deleteEntities: async entities => {
        return fetchRawls(`${root}/entities/delete`, _.mergeAll([authOpts(), jsonBody(entities), { signal, method: 'POST' }]))
      },

      copyEntities: async (destNamespace, destName, entityType, entities, link) => {
        const payload = {
          sourceWorkspace: { namespace, name },
          destinationWorkspace: { namespace: destNamespace, name: destName },
          entityType,
          entityNames: entities
        }
        const res = await fetchRawls(`workspaces/entities/copy?linkExistingEntities=${link}`, _.mergeAll([authOpts(), jsonBody(payload),
          { signal, method: 'POST' }]))
        return res.json()
      },

      storageCostEstimate: async () => {
        const res = await fetchOrchestration(`api/workspaces/${namespace}/${name}/storageCostEstimate`, _.merge(authOpts(), { signal }))
        return res.json()
      }
    }
  }
})


const Buckets = signal => ({
  getObject: async (bucket, object, namespace) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}`,
      _.merge(authOpts(await User(signal).token(namespace)), { signal })
    ).then(
      res => res.json()
    )
  },

  getObjectPreview: async (bucket, object, namespace, previewFull = false) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}?alt=media`,
      _.mergeAll([
        authOpts(await User(signal).token(namespace)),
        { signal },
        previewFull ? {} : { headers: { Range: 'bytes=0-20000' } }
      ])
    )
  },

  listNotebooks: async (namespace, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      _.merge(authOpts(await User(signal).token(namespace)), { signal })
    )
    const { items } = await res.json()
    return _.filter(({ name }) => name.endsWith('.ipynb'), items)
  },

  list: async (namespace, bucket, prefix) => {
    const res = await fetchBuckets(
      `storage/v1/b/${bucket}/o?${qs.stringify({ prefix, delimiter: '/' })}`,
      _.merge(authOpts(await User(signal).token(namespace)), { signal })
    )
    return res.json()
  },

  delete: async (namespace, bucket, name) => {
    return fetchBuckets(
      `storage/v1/b/${bucket}/o/${encodeURIComponent(name)}`,
      _.merge(authOpts(await User(signal).token(namespace)), { signal, method: 'DELETE' })
    )
  },

  upload: async (namespace, bucket, prefix, file) => {
    return fetchBuckets(
      `upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(prefix + file.name)}`,
      _.merge(authOpts(await User(signal).token(namespace)), {
        signal, method: 'POST', body: file,
        headers: { 'Content-Type': file.type, 'Content-Length': file.size }
      })
    )
  },

  notebook: (namespace, bucket, name) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    const copy = async (newName, newBucket) => {
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}/copyTo/b/${newBucket}/o/${nbName(newName)}`,
        _.merge(authOpts(await User(signal).token(namespace)), { signal, method: 'POST' })
      )
    }
    const doDelete = async () => {
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}`,
        _.merge(authOpts(await User(signal).token(namespace)), { signal, method: 'DELETE' })
      )
    }

    const getObject = async () => {
      const res = await fetchBuckets(
        `${bucketUrl}/${nbName(name)}`,
        _.merge(authOpts(await User(signal).token(namespace)), { signal, method: 'GET' })
      )
      return await res.json()
    }
    return {
      preview: async () => {
        const nb = await fetchBuckets(
          `${bucketUrl}/${encodeURIComponent(`notebooks/${name}`)}?alt=media`,
          _.merge(authOpts(await User(signal).token(namespace)), { signal })
        ).then(res => res.text())
        return fetchOk(`${getConfig().calhounUrlRoot}/api/convert`,
          _.mergeAll([authOpts(), { signal, method: 'POST', body: nb }])
        ).then(res => res.text())
      },

      copy,

      create: async contents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${nbName(name)}`,
          _.merge(authOpts(await User(signal).token(namespace)), {
            signal, method: 'POST', body: JSON.stringify(contents),
            headers: { 'Content-Type': 'application/x-ipynb+json' }
          })
        )
      },

      delete: doDelete,

      getObject,

      rename: async newName => {
        await copy(newName, bucket)
        return doDelete()
      }
    }
  }
})


const Methods = signal => ({
  list: async params => {
    const res = await fetchAgora(`methods?${qs.stringify(params)}`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  configInputsOutputs: async loadedConfig => {
    const res = await fetchRawls('methodconfigs/inputsOutputs',
      _.mergeAll([authOpts(), jsonBody(loadedConfig.methodRepoMethod), { signal, method: 'POST' }]))
    return res.json()
  },

  method: (namespace, name, snapshotId) => {
    const root = `methods/${namespace}/${name}/${snapshotId}`

    return {
      get: async () => {
        const res = await fetchAgora(root, _.merge(authOpts(), { signal }))
        return res.json()
      }
    }
  }
})


const Jupyter = signal => ({
  clustersList: async () => {
    const res = await fetchLeo('api/clusters?saturnAutoCreated=true', _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },

  cluster: (project, name) => {
    const root = `api/cluster/${project}/${name}`

    return {
      create: async clusterOptions => {
        const body = _.merge(clusterOptions, {
          labels: { saturnAutoCreated: 'true', saturnVersion: version },
          defaultClientId: getConfig().googleClientId,
          userJupyterExtensionConfig: {
            nbExtensions: {
              'saturn-iframe-extension':
                `${window.location.hostname === 'localhost' ? getConfig().devUrlRoot : window.location.origin}/jupyter-iframe-extension.js`
            },
            serverExtensions: {},
            combinedExtensions: {}
          }
        })
        return fetchLeo(`api/cluster/v2/${project}/${name}`, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'PUT' }, appIdentifier]))
      },

      start: () => {
        return fetchLeo(`${root}/start`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },

      stop: () => {
        return fetchLeo(`${root}/stop`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },

      delete: () => {
        return fetchLeo(root, _.mergeAll([authOpts(), { signal, method: 'DELETE' }, appIdentifier]))
      }
    }
  },

  notebooks: (project, name) => {
    const root = `notebooks/${project}/${name}`

    return {
      localize: files => {
        return fetchLeo(`${root}/api/localize`,
          _.mergeAll([authOpts(), jsonBody(files), { signal, method: 'POST' }]))
      },

      setCookie: () => {
        return fetchLeo(`${root}/setCookie`,
          _.merge(authOpts(), { signal, credentials: 'include' }))
      }
    }
  }
})


const Dockstore = signal => ({
  getWdl: async (path, version) => {
    const res = await fetchDockstore(`${dockstoreMethodPath(path)}/${encodeURIComponent(version)}/WDL/descriptor`, { signal })
    return res.json()
  },

  getVersions: async path => {
    const res = await fetchDockstore(dockstoreMethodPath(path), { signal })
    return res.json()
  }
})


const Martha = signal => ({
  call: async uri => {
    return fetchOk(getConfig().marthaUrlRoot,
      _.mergeAll([jsonBody({ uri }), authOpts(), appIdentifier, { signal, method: 'POST' }])
    ).then(res => res.json())
  }
})


export const Ajax = controller => {
  const signal = controller && controller.signal

  return {
    User: User(signal),
    Groups: Groups(signal),
    Billing: Billing(signal),
    Workspaces: Workspaces(signal),
    Buckets: Buckets(signal),
    Methods: Methods(signal),
    Jupyter: Jupyter(signal),
    Dockstore: Dockstore(signal),
    Martha: Martha(signal)
  }
}


export const ajaxCaller = WrappedComponent => {
  class Wrapper extends Component {
    constructor(props) {
      super(props)
      this.controller = new window.AbortController()
      this.ajax = Ajax(this.controller)
    }

    static displayName = 'ajaxCaller()'

    render() {
      return h(WrappedComponent, {
        ...this.props,
        ajax: this.ajax
      })
    }

    componentWillUnmount() {
      this.controller.abort()
    }
  }

  return Wrapper
}
