import _ from 'lodash/fp'
import * as qs from 'qs'
import { h } from 'react-hyperscript-helpers'
import { version } from 'src/data/machines'
import { getUser } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import { withErrorIgnoring } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { ajaxOverridesStore, knownBucketRequesterPaysStatuses, requesterPaysProjectStore, workspaceStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const dataprocRuntime = {
  id: 24460,
  runtimeName: 'saturn-0f58061f-42c7-4980-af22-c72f83df6785',
  googleProject: 'general-dev-billing-account',
  auditInfo: {
    creator: 'b.adm.firec@gmail.com',
    createdDate: '2020-07-17T15:07:52.241Z',
    destroyedDate: null,
    dateAccessed: '2020-07-17T15:07:53.046Z'
  },
  runtimeConfig: {
    numberOfWorkers: 0,
    masterMachineType: 'n1-standard-4',
    masterDiskSize: 60,
    workerMachineType: null,
    workerDiskSize: null,
    numberOfWorkerLocalSSDs: null,
    numberOfPreemptibleWorkers: null,
    cloudService: 'DATAPROC'
  },
  proxyUrl: 'https://leonardo.dsde-dev.broadinstitute.org/proxy/general-dev-billing-account/saturn-0f58061f-42c7-4980-af22-c72f83df6785/jupyter',
  status: 'Running',
  labels: {
    saturnVersion: '6',
    tool: 'Jupyter',
    'saturn-iframe-extension': 'https://bvdp-saturn-dev.appspot.com/jupyter-iframe-extension.js',
    creator: 'b.adm.firec@gmail.com',
    runtimeName: 'saturn-0f58061f-42c7-4980-af22-c72f83df6785',
    googleProject: 'general-dev-billing-account',
    clusterServiceAccount: 'pet-100271339377034276912@general-dev-billing-account.iam.gserviceaccount.com',
    saturnIsProjectSpecific: 'false',
    saturnAutoCreated: 'true',
    clusterName: 'saturn-0f58061f-42c7-4980-af22-c72f83df6785'
  },
  patchInProgress: false
}

const gceRuntime = {
  id: 24365,
  runtimeName: 'saturn-f9694786-ce63-4b82-972c-3c108f5970c0',
  googleProject: 'general-dev-billing-account',
  auditInfo: {
    creator: 'b.adm.firec@gmail.com',
    createdDate: '2020-07-01T13:05:45.619Z',
    destroyedDate: null,
    dateAccessed: '2020-07-09T14:04:37.347Z'
  },
  runtimeConfig: {
    machineType: 'n1-standard-2',
    diskSize: 40,
    cloudService: 'GCE',
    bootDiskSize: 50
  },
  proxyUrl: 'https://leonardo.dsde-dev.broadinstitute.org/proxy/general-dev-billing-account/saturn-f9694786-ce63-4b82-972c-3c108f5970c0/jupyter',
  status: 'Running',
  labels: {
    deletionConfirmed: 'false',
    saturnVersion: '6',
    tool: 'Jupyter',
    'saturn-iframe-extension': 'https://bvdp-saturn-dev.appspot.com/jupyter-iframe-extension.js',
    creator: 'b.adm.firec@gmail.com',
    runtimeName: 'saturn-f9694786-ce63-4b82-972c-3c108f5970c0',
    googleProject: 'general-dev-billing-account',
    clusterServiceAccount: 'pet-100271339377034276912@general-dev-billing-account.iam.gserviceaccount.com',
    saturnIsProjectSpecific: 'false',
    saturnAutoCreated: 'true',
    clusterName: 'saturn-f9694786-ce63-4b82-972c-3c108f5970c0'
  },
  patchInProgress: false
}

const gceRuntimeWithPd = _.flow(_.unset(['runtimeConfig', 'diskSize']), _.set(['runtimeConfig', 'persistentDiskId'], 21))(gceRuntime)

const disk = {
  id: 21,
  googleProject: 'general-dev-billing-account',
  zone: 'us-central1-a',
  name: 'fakeDisk',
  status: 'Ready',
  auditInfo: {
    creator: 'b.adm.firec@gmail.com',
    createdDate: '2020-07-16T18:42:14.941807Z',
    destroyedDate: null,
    dateAccessed: '2020-07-16T18:42:09.784Z'
  },
  size: 500,
  diskType: 'pd-standard',
  blockSize: 4096
}

const runtimeDetails = {
  runtimeImages: [
    { imageType: 'Jupyter', imageUrl: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-gatk:1.0.3', timestamp: '2020-07-17T15:07:52.241Z' },
    { imageType: 'Proxy', imageUrl: 'broadinstitute/openidc-proxy:2.3.1_2', timestamp: '2020-07-17T15:07:52.241Z' },
    { imageType: 'VM', imageUrl: 'projects/broad-dsp-gcr-public/global/images/custom-leo-image-dataproc-1-4-15-debian9-2020-07-02', timestamp: '2020-07-17T15:07:53.046Z' },
    { imageType: 'Welder', imageUrl: 'us.gcr.io/broad-dsp-gcr-public/welder-server:5426cf0', timestamp: '2020-07-17T15:07:52.241Z' }
  ],
  jupyterUserScriptUri: null
}

// eslint-disable-next-line no-unused-vars
const pdOverrides = _.mapValues(({ runtimes, disks }) => {
  const stub = v => () => async (url, { method = 'GET', body }) => {
    console.log({ method, url, body: body && JSON.parse(body) })
    await Utils.delay(3000)
    return new Response(JSON.stringify(v))
  }
  return [
    { filter: { url: /v1\/runtimes\?/ }, fn: stub(runtimes) },
    { filter: { url: /v1\/disks\?/ }, fn: stub(disks) },
    { filter: { url: /v1\/disks\/.+\/.+$/, method: 'PATCH' }, fn: stub({}) },
    { filter: { url: /v1\/disks\/.+\/.+$/, method: 'DELETE' }, fn: stub({}) },
    { filter: { url: /v1\/runtimes\/.+\/.+$/, method: 'GET' }, fn: stub({ ...runtimes[0], ...runtimeDetails }) },
    { filter: { url: /v1\/runtimes\/.+\/.+$/, method: 'POST' }, fn: stub({}) },
    { filter: { url: /v1\/runtimes\/.+\/.+$/, method: 'DELETE' }, fn: stub({}) }
  ]
}, {
  nothing: { runtimes: [], disks: [] },
  gce: { runtimes: [gceRuntime], disks: [] },
  dataproc: { runtimes: [dataprocRuntime], disks: [] },
  disk: { runtimes: [], disks: [disk] },
  gceAndDisk: { runtimes: [gceRuntime], disks: [disk] },
  gceAndAttachedDisk: { runtimes: [gceRuntimeWithPd], disks: [disk] }
})

window.ajaxOverrideUtils = {
  mapJsonBody: _.curry((fn, wrappedFetch) => async (...args) => {
    const res = await wrappedFetch(...args)
    return new Response(JSON.stringify(fn(await res.json())), res)
  }),
  makeError: _.curry(({ status, frequency = 1 }, wrappedFetch) => (...args) => {
    return Math.random() < frequency ?
      Promise.resolve(new Response('Instrumented error', { status })) :
      wrappedFetch(...args)
  })
}
ajaxOverridesStore.set(pdOverrides.gceAndAttachedDisk)

const authOpts = (token = getUser().token) => ({ headers: { Authorization: `Bearer ${token}` } })
const jsonBody = body => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
const appIdentifier = { headers: { 'X-App-ID': 'Saturn' } }
const tosData = { appid: 'Saturn', tosversion: 6 }

// Allows use of ajaxOverrideStore to stub responses for testing
const withInstrumentation = wrappedFetch => (...args) => {
  return _.flow(
    ..._.map('fn', _.filter(({ filter }) => {
      const [url, { method = 'GET' } = {}] = args
      return _.isFunction(filter) ? filter(...args) : url.match(filter.url) && (!filter.method || filter.method === method)
    }, ajaxOverridesStore.get()))
  )(wrappedFetch)(...args)
}

// Ignores cancellation error when request is cancelled
const withCancellation = wrappedFetch => async (...args) => {
  try {
    return await wrappedFetch(...args)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return Utils.abandonedPromise()
    } else {
      throw error
    }
  }
}

// Converts non-200 responses to exceptions
const withErrorRejection = wrappedFetch => async (...args) => {
  const res = await wrappedFetch(...args)
  if (res.ok) {
    return res
  } else {
    throw res
  }
}

const withUrlPrefix = _.curry((prefix, wrappedFetch) => (path, ...args) => {
  return wrappedFetch(prefix + path, ...args)
})

const withAppIdentifier = wrappedFetch => (url, options) => {
  return wrappedFetch(url, _.merge(options, appIdentifier))
}

const checkRequesterPaysError = async response => {
  if (response.status === 400) {
    const data = await response.text()
    const requesterPaysError = _.includes('requester pays', data)
    return Object.assign(new Response(new Blob([data]), response), { requesterPaysError })
  } else {
    return Object.assign(response, { requesterPaysError: false })
  }
}

/*
 * Detects errors due to requester pays buckets, and adds the current workspace's billing
 * project if the user has access, retrying the request once if necessary.
 */
const withRequesterPays = wrappedFetch => (url, ...args) => {
  const bucket = /\/b\/([^/?]+)[/?]/.exec(url)[1]
  const { workspace, canCompute } = workspaceStore.get() || {}
  const workspaceProject = workspace?.namespace

  const canUseWorkspaceProject = async () => {
    return canCompute || _.some({ projectName: workspaceProject, role: 'Owner' }, await Ajax().Billing.listProjects())
  }

  const getUserProject = async () => {
    if (!requesterPaysProjectStore.get() && workspaceProject && await canUseWorkspaceProject()) {
      requesterPaysProjectStore.set(workspaceProject)
    }
    return requesterPaysProjectStore.get()
  }

  const tryRequest = async () => {
    const knownRequesterPays = knownBucketRequesterPaysStatuses.get()[bucket]
    try {
      const userProject = (knownRequesterPays && await getUserProject()) || undefined
      const res = await wrappedFetch(Utils.mergeQueryParams({ userProject }, url), ...args)
      !knownRequesterPays && knownBucketRequesterPaysStatuses.update(_.set(bucket, false))
      return res
    } catch (error) {
      if (knownRequesterPays === false) {
        throw error
      } else {
        const newResponse = await checkRequesterPaysError(error)
        if (newResponse.requesterPaysError && !knownRequesterPays) {
          knownBucketRequesterPaysStatuses.update(_.set(bucket, true))
          if (await getUserProject()) {
            return tryRequest()
          }
        }
        throw newResponse
      }
    }
  }
  return tryRequest()
}

export const fetchOk = _.flow(withInstrumentation, withCancellation, withErrorRejection)(fetch)

const fetchSam = _.flow(withUrlPrefix(`${getConfig().samUrlRoot}/`), withAppIdentifier)(fetchOk)
const fetchBuckets = _.flow(withRequesterPays, withUrlPrefix('https://storage.googleapis.com/'))(fetchOk)
const fetchGoogleBilling = withUrlPrefix('https://cloudbilling.googleapis.com/v1/', fetchOk)
const fetchRawls = _.flow(withUrlPrefix(`${getConfig().rawlsUrlRoot}/api/`), withAppIdentifier)(fetchOk)
const fetchLeo = withUrlPrefix(`${getConfig().leoUrlRoot}/`, fetchOk)
const fetchDockstore = withUrlPrefix(`${getConfig().dockstoreUrlRoot}/api/`, fetchOk)
const fetchAgora = _.flow(withUrlPrefix(`${getConfig().agoraUrlRoot}/api/v1/`), withAppIdentifier)(fetchOk)
const fetchOrchestration = _.flow(withUrlPrefix(`${getConfig().orchestrationUrlRoot}/`), withAppIdentifier)(fetchOk)
const fetchProfile = withUrlPrefix(`${getConfig().profileUrlRoot}/`, fetchOk)
const fetchRex = withUrlPrefix(`${getConfig().rexUrlRoot}/api/`, fetchOk)
const fetchBond = withUrlPrefix(`${getConfig().bondUrlRoot}/`, fetchOk)
const fetchMartha = withUrlPrefix(`${getConfig().marthaUrlRoot}/`, fetchOk)
const fetchBard = withUrlPrefix(`${getConfig().bardRoot}/`, fetchOk)

const nbName = name => encodeURIComponent(`notebooks/${name}.ipynb`)

// %23 = '#', %2F = '/'
const dockstoreMethodPath = path => `api/ga4gh/v1/tools/%23workflow%2F${encodeURIComponent(path)}/versions`

/**
 * Only use this if the user has write access to the workspace to avoid proliferation of service accounts in projects containing public workspaces.
 * If we want to fetch a SA token for read access, we must use a "default" SA instead (api/google/user/petServiceAccount/token).
 */
const getServiceAccountToken = Utils.memoizeAsync(async (namespace, token) => {
  const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
  const res = await fetchSam(
    `api/google/user/petServiceAccount/${namespace}/token`,
    _.mergeAll([authOpts(token), jsonBody(scopes), { method: 'POST' }])
  )
  return res.json()
}, { expires: 1000 * 60 * 30, keyFn: (...args) => JSON.stringify(args) })

export const saToken = namespace => getServiceAccountToken(namespace, getUser().token)

const getFirstTimeStamp = Utils.memoizeAsync(async token => {
  const res = await fetchRex('firstTimestamps/record', _.mergeAll([authOpts(token), { method: 'POST' }]))
  return res.json()
}, { keyFn: (...args) => JSON.stringify(args) })

const User = signal => ({
  getStatus: async () => {
    const res = await fetchOk(`${getConfig().samUrlRoot}/register/user/v2/self/info`, _.mergeAll([authOpts(), { signal }, appIdentifier]))
    return res.json()
  },

  profile: {
    get: async () => {
      const res = await fetchOrchestration('register/profile', _.merge(authOpts(), { signal }))
      return res.json()
    },

    //We are not calling SAM directly because free credits logic is in orchestration
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
    },

    setPreferences: body => {
      return fetchOrchestration('api/profile/preferences', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
    },

    preferLegacyFirecloud: () => {
      return fetchOrchestration('api/profile/terra', _.mergeAll([authOpts(), { signal, method: 'DELETE' }]))
    }
  },

  acceptEula: () => {
    return fetchOrchestration('api/profile/trial/userAgreement', _.merge(authOpts(), { signal, method: 'PUT' }))
  },

  startTrial: () => {
    return fetchOrchestration('api/profile/trial', _.merge(authOpts(), { signal, method: 'POST' }))
  },

  finalizeTrial: () => {
    return fetchOrchestration('api/profile/trial?operation=finalize', _.merge(authOpts(), { signal, method: 'POST' }))
  },

  getProxyGroup: async email => {
    const res = await fetchOrchestration(`api/proxyGroup/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  getTosAccepted: async () => {
    const url = `${getConfig().tosUrlRoot}/user/response?${qs.stringify(tosData)}`
    try {
      const res = await fetchOk(url, _.merge(authOpts(), { signal }))
      const { accepted } = await res.json()
      return accepted
    } catch (error) {
      if (error.status === 403 || error.status === 404) {
        return false
      } else {
        throw error
      }
    }
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
  createSupportRequest: ({ name, email, currUrl, subject, type, description, attachmentToken, emailAgreed, clinicalUser }) => {
    return fetchOk(
      `https://support.terra.bio/api/v2/requests.json`,
      _.merge({ signal, method: 'POST' }, jsonBody({
        request: {
          requester: { name, email },
          subject,
          // BEWARE changing the following ids or values! If you change them then you must thoroughly test.
          custom_fields: [
            { id: 360012744452, value: type },
            { id: 360007369412, value: description },
            { id: 360012744292, value: name },
            { id: 360012782111, value: email },
            { id: 360018545031, value: emailAgreed },
            { id: 360027463271, value: clinicalUser }
          ],
          comment: {
            body: `${description}\n\n------------------\nSubmitted from: ${currUrl}`,
            uploads: [`${attachmentToken}`]
          }
        }
      })))
  },

  uploadAttachment: async file => {
    const res = await fetchOk(`https://support.terra.bio/api/v2/uploads?filename=${file.name}`, {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': 'application/binary'
      }
    })
    return (await res.json()).upload
  },

  firstTimestamp: () => {
    return getFirstTimeStamp(getUser().token)
  },

  lastNpsResponse: async () => {
    const res = await fetchRex('npsResponses/lastTimestamp', _.merge(authOpts(), { signal }))
    return res.json()
  },

  postNpsResponse: body => {
    return fetchRex('npsResponses/create', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
  },

  getNihStatus: async () => {
    try {
      const res = await fetchOrchestration('api/nih/status', _.merge(authOpts(), { signal }))
      return res.json()
    } catch (error) {
      if (error.status === 404) {
        return {}
      } else {
        throw error
      }
    }
  },

  linkNihAccount: async token => {
    const res = await fetchProfile('shibboleth-token', _.merge(authOpts(), { body: token, signal, method: 'POST' }))
    return res.json()
  },

  getFenceStatus: async provider => {
    try {
      const res = await fetchBond(`api/link/v1/${provider}`, _.merge(authOpts(), { signal }))
      return res.json()
    } catch (error) {
      if (error.status === 404) {
        return {}
      } else {
        throw error
      }
    }
  },

  getFenceAuthUrl: async (provider, redirectUri) => {
    const queryParams = {
      scopes: ['openid', 'google_credentials'],
      redirect_uri: redirectUri,
      state: btoa(JSON.stringify({ provider }))
    }
    const res = await fetchBond(`api/link/v1/${provider}/authorization-url?${qs.stringify(queryParams, { indices: false })}`, { signal })
    return res.json()
  },

  linkFenceAccount: async (provider, authCode, redirectUri) => {
    const queryParams = {
      oauthcode: authCode,
      redirect_uri: redirectUri
    }
    const res = await fetchBond(`api/link/v1/${provider}/oauthcode?${qs.stringify(queryParams)}`, _.merge(authOpts(), { signal, method: 'POST' }))
    return res.json()
  },

  isUserRegistered: async email => {
    try {
      await fetchSam(`api/users/v1/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'GET' }))
    } catch (error) {
      if (error.status === 404) {
        return false
      } else {
        throw error
      }
    }
    return true
  },

  inviteUser: email => {
    return fetchSam(`api/users/v1/invite/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'POST' }))
  }
})

const Groups = signal => ({
  list: async () => {
    const res = await fetchSam('api/groups/v1', _.merge(authOpts(), { signal }))
    return res.json()
  },

  group: groupName => {
    const root = `api/groups/v1/${groupName}`
    const resourceRoot = `api/resources/v1/managed-group/${groupName}`

    const addRole = (role, email) => {
      return fetchSam(`${root}/${role}/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'PUT' }))
    }

    const removeRole = (role, email) => {
      return fetchSam(`${root}/${role}/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'DELETE' }))
    }

    return {
      create: () => {
        return fetchSam(root, _.merge(authOpts(), { signal, method: 'POST' }))
      },

      delete: () => {
        return fetchSam(root, _.merge(authOpts(), { signal, method: 'DELETE' }))
      },

      listAdmins: async () => {
        const res = await fetchSam(`${root}/admin`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      listMembers: async () => {
        const res = await fetchSam(`${root}/member`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      addUser: (roles, email) => {
        return Promise.all(_.map(role => addRole(role, email), roles))
      },

      removeUser: (roles, email) => {
        return Promise.all(_.map(role => removeRole(role, email), roles))
      },

      changeUserRoles: async (email, oldRoles, newRoles) => {
        if (!_.isEqual(oldRoles, newRoles)) {
          await Promise.all(_.map(role => addRole(role, email), _.difference(newRoles, oldRoles)))
          return Promise.all(_.map(role => removeRole(role, email), _.difference(oldRoles, newRoles)))
        }
      },

      requestAccess: async () => {
        await fetchSam(`${root}/requestAccess`, _.merge(authOpts(), { signal, method: 'POST' }))
      },

      getPolicy: async policyName => {
        const res = await fetchSam(`${resourceRoot}/policies/${policyName}/public`, _.merge(authOpts(), { signal }))
        return await res.json()
      },

      setPolicy: (policyName, value) => {
        return fetchSam(`${resourceRoot}/policies/${policyName}/public`, _.mergeAll([authOpts(), { signal, method: 'PUT' }, jsonBody(value)]))
      }
    }
  }
})


const Billing = signal => ({
  listProjects: async () => {
    const res = await fetchRawls('user/billing', _.merge(authOpts(), { signal }))
    return res.json()
  },

  listAccounts: async () => {
    const res = await fetchRawls('user/billingAccounts', _.merge(authOpts(), { signal }))
    return res.json()
  },

  createProject: async (projectName, billingAccount) => {
    const res = await fetchRawls('billing',
      _.mergeAll([authOpts(), jsonBody({ projectName, billingAccount }), { signal, method: 'POST' }]))
    return res
  },

  project: projectName => {
    const root = `billing/${projectName}`

    const removeRole = (role, email) => {
      return fetchRawls(`${root}/${role}/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'DELETE' }))
    }

    const addRole = (role, email) => {
      return fetchRawls(`${root}/${role}/${encodeURIComponent(email)}`, _.merge(authOpts(), { signal, method: 'PUT' }))
    }

    return {
      listUsers: async () => {
        const res = await fetchRawls(`${root}/members`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      addUser: (roles, email) => {
        return Promise.all(_.map(role => addRole(role, email), roles))
      },

      removeUser: (roles, email) => {
        return Promise.all(_.map(role => removeRole(role, email), roles))
      },

      changeUserRoles: async (email, oldRoles, newRoles) => {
        if (!_.isEqual(oldRoles, newRoles)) {
          await Promise.all(_.map(role => addRole(role, email), _.difference(newRoles, oldRoles)))
          return Promise.all(_.map(role => removeRole(role, email), _.difference(oldRoles, newRoles)))
        }
      }
    }
  }
})

const attributesUpdateOps = _.flow(
  _.toPairs,
  _.flatMap(([k, v]) => {
    return _.isArray(v) ?
      [
        { op: 'RemoveAttribute', attributeName: k },
        ...(_.isObject(v[0]) ?
          [{ op: 'CreateAttributeEntityReferenceList', attributeListName: k }] :
          [{ op: 'CreateAttributeValueList', attributeName: k }]
        ),
        ..._.map(x => ({ op: 'AddListMember', attributeListName: k, newMember: x }), v)
      ] :
      [{ op: 'AddUpdateAttribute', attributeName: k, addUpdateAttribute: v }]
  })
)

const Workspaces = signal => ({
  list: async fields => {
    const res = await fetchRawls(`workspaces?${qs.stringify({ fields }, { arrayFormat: 'comma' })}`, _.merge(authOpts(), { signal }))
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

  getTags: async tag => {
    const res = await fetchRawls(`workspaces/tags?${qs.stringify({ q: tag })}`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  workspace: (namespace, name) => {
    const root = `workspaces/${namespace}/${name}`
    const mcPath = `${root}/methodconfigs`

    const upsertEntities = entities => {
      const body = _.map(({ name, entityType, attributes }) => {
        return { name, entityType, operations: attributesUpdateOps(attributes) }
      }, entities)

      return fetchRawls(`${root}/entities/batchUpsert`, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
    }

    return {
      checkBucketReadAccess: () => {
        return fetchRawls(`${root}/checkBucketReadAccess`, _.merge(authOpts(), { signal }))
      },

      checkBucketAccess: async (bucket, accessLevel) => {
        // Protect against asking for a project-specific pet service account token if user cannot write to the workspace
        if (!Utils.canWrite(accessLevel)) {
          return false
        }

        const res = await fetchBuckets(`storage/v1/b/${bucket}?fields=billing`,
          _.merge(authOpts(await saToken(namespace)), { signal }))
        return res.json()
      },

      details: async fields => {
        const res = await fetchRawls(`${root}?${qs.stringify({ fields }, { arrayFormat: 'comma' })}`, _.merge(authOpts(), { signal }))
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

          abort: () => {
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

      entityMetadata: async () => {
        const res = await fetchRawls(`${root}/entities`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      createEntity: async payload => {
        const res = await fetchRawls(`${root}/entities`, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'POST' }]))
        return res.json()
      },

      renameEntity: (type, name, newName) => {
        return fetchRawls(`${root}/entities/${type}/${name}/rename`, _.mergeAll([authOpts(), jsonBody({ name: newName }),
          { signal, method: 'POST' }]))
      },

      deleteEntityAttribute: (type, name, attributeName) => {
        return fetchRawls(`${root}/entities/${type}/${name}`, _.mergeAll([authOpts(), jsonBody([{ op: 'RemoveAttribute', attributeName }]),
          { signal, method: 'PATCH' }]))
      },

      upsertEntities,

      entitiesOfType: async type => {
        const res = await fetchRawls(`${root}/entities/${type}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      paginatedEntitiesOfType: async (type, parameters) => {
        const res = await fetchRawls(`${root}/entityQuery/${type}?${qs.stringify(parameters)}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      deleteEntities: entities => {
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

      importBagit: bagitURL => {
        return fetchOrchestration(
          `api/workspaces/${namespace}/${name}/importBagit`,
          _.mergeAll([authOpts(), jsonBody({ bagitURL, format: 'TSV' }), { signal, method: 'POST' }])
        )
      },

      importJSON: async url => {
        const res = await fetchOk(url)
        const payload = await res.json()

        return upsertEntities(payload)
      },

      importEntitiesFile: file => {
        const formData = new FormData()
        formData.set('entities', file)
        return fetchOrchestration(`api/${root}/importEntities`, _.merge(authOpts(), { body: formData, signal, method: 'POST' }))
      },

      importFlexibleEntitiesFile: file => {
        const formData = new FormData()
        formData.set('entities', file)
        return fetchOrchestration(`api/${root}/flexibleImportEntities`, _.merge(authOpts(), { body: formData, signal, method: 'POST' }))
      },

      importPFB: async url => {
        const res = await fetchOrchestration(`api/${root}/importPFB`, _.mergeAll([authOpts(), jsonBody({ url }), { signal, method: 'POST' }]))
        return res.json()
      },

      importPFBStatus: async jobId => {
        const res = await fetchOrchestration(`api/${root}/importPFB/${jobId}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      importAttributes: file => {
        const formData = new FormData()
        formData.set('attributes', file)
        return fetchOrchestration(`api/${root}/importAttributesTSV`, _.merge(authOpts(), { body: formData, signal, method: 'POST' }))
      },

      exportAttributes: async () => {
        const res = await fetchOrchestration(`api/${root}/exportAttributesTSV`, _.merge(authOpts(), { signal }))
        return res.blob()
      },

      storageCostEstimate: async () => {
        const res = await fetchOrchestration(`api/workspaces/${namespace}/${name}/storageCostEstimate`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      getTags: async () => {
        const res = await fetchOrchestration(`api/workspaces/${namespace}/${name}/tags`, _.merge(authOpts(), { signal, method: 'GET' }))
        return res.json()
      },

      addTag: async tag => {
        const res = await fetchOrchestration(`api/workspaces/${namespace}/${name}/tags`,
          _.mergeAll([authOpts(), jsonBody([tag]), { signal, method: 'PATCH' }]))
        return res.json()
      },

      deleteTag: async tag => {
        const res = await fetchOrchestration(`api/workspaces/${namespace}/${name}/tags`,
          _.mergeAll([authOpts(), jsonBody([tag]), { signal, method: 'DELETE' }]))
        return res.json()
      },

      accessInstructions: async () => {
        const res = await fetchRawls(`${root}/accessInstructions`, _.merge(authOpts(), { signal }))
        return res.json()
      }
    }
  }
})


const Buckets = signal => ({
  getObject: async (bucket, object, namespace, params = {}) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}${qs.stringify(params, { addQueryPrefix: true })}`,
      _.merge(authOpts(await saToken(namespace)), { signal })
    ).then(
      res => res.json()
    )
  },

  getObjectPreview: async (bucket, object, namespace, previewFull = false) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}?alt=media`,
      _.mergeAll([
        authOpts(await saToken(namespace)),
        { signal },
        previewFull ? {} : { headers: { Range: 'bytes=0-20000' } }
      ])
    )
  },

  getServiceAlerts: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/alerts.json`, { signal })
    return res.json()
  },

  getFeaturedWorkspaces: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/featured-workspaces.json`, { signal })
    return res.json()
  },

  listNotebooks: async (namespace, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      _.merge(authOpts(await saToken(namespace)), { signal })
    )
    const { items } = await res.json()
    return _.filter(({ name }) => name.endsWith('.ipynb'), items)
  },

  list: async (namespace, bucket, prefix) => {
    const res = await fetchBuckets(
      `storage/v1/b/${bucket}/o?${qs.stringify({ prefix, delimiter: '/' })}`,
      _.merge(authOpts(await saToken(namespace)), { signal })
    )
    return res.json()
  },

  delete: async (namespace, bucket, name) => {
    return fetchBuckets(
      `storage/v1/b/${bucket}/o/${encodeURIComponent(name)}`,
      _.merge(authOpts(await saToken(namespace)), { signal, method: 'DELETE' })
    )
  },

  upload: async (namespace, bucket, prefix, file) => {
    return fetchBuckets(
      `upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(prefix + file.name)}`,
      _.merge(authOpts(await saToken(namespace)), {
        signal, method: 'POST', body: file,
        headers: { 'Content-Type': file.type, 'Content-Length': file.size }
      })
    )
  },

  notebook: (namespace, bucket, name) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    const copy = async (newName, newBucket, clearMetadata) => {
      const body = clearMetadata ? { metadata: { lastLockedBy: '' } } : {}
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}/copyTo/b/${newBucket}/o/${nbName(newName)}`,
        _.mergeAll([authOpts(await saToken(namespace)), jsonBody(body), { signal, method: 'POST' }])
      )
    }
    const doDelete = async () => {
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}`,
        _.merge(authOpts(await saToken(namespace)), { signal, method: 'DELETE' })
      )
    }

    const getObject = async () => {
      const res = await fetchBuckets(
        `${bucketUrl}/${nbName(name)}`,
        _.merge(authOpts(await saToken(namespace)), { signal, method: 'GET' })
      )
      return await res.json()
    }

    return {
      preview: async () => {
        const nb = await fetchBuckets(
          `${bucketUrl}/${encodeURIComponent(`notebooks/${name}`)}?alt=media`,
          _.merge(authOpts(await saToken(namespace)), { signal })
        ).then(res => res.text())
        return fetchOk(`${getConfig().calhounUrlRoot}/api/convert`,
          _.mergeAll([authOpts(), { signal, method: 'POST', body: nb }])
        ).then(res => res.text())
      },

      copy,

      create: async contents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${nbName(name)}`,
          _.merge(authOpts(await saToken(namespace)), {
            signal, method: 'POST', body: JSON.stringify(contents),
            headers: { 'Content-Type': 'application/x-ipynb+json' }
          })
        )
      },

      delete: doDelete,

      getObject,

      rename: async newName => {
        await copy(newName, bucket, false)
        return doDelete()
      }
    }
  }
})


const GoogleBilling = signal => ({
  listProjectNames: async billingAccountName => {
    const response = await fetchGoogleBilling(`${billingAccountName}/projects`, _.merge(authOpts(), { signal }))
    const json = await response.json()
    return _.map('projectId', json.projectBillingInfo)
  },
  getBillingInfo: async project => {
    const response = await fetchGoogleBilling(`projects/${project}/billingInfo`, _.merge(authOpts(), { signal }))
    return response.json()
  },
  changeBillingAccount: async ({ projectId, newAccountName }) => {
    const name = `projects/${projectId}/billingInfo`
    const response = await fetchGoogleBilling(name,
      _.mergeAll([
        authOpts(), { signal, method: 'PUT' },
        jsonBody({ billingEnabled: true, billingAccountName: newAccountName, name, projectId })
      ]))
    return response.json()
  }
})


const Methods = signal => ({
  list: async params => {
    const res = await fetchAgora(`methods?${qs.stringify(params)}`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  definitions: async () => {
    const res = await fetchAgora(`methods/definitions`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  configInputsOutputs: async loadedConfig => {
    const res = await fetchRawls('methodconfigs/inputsOutputs',
      _.mergeAll([authOpts(), jsonBody(loadedConfig.methodRepoMethod), { signal, method: 'POST' }]))
    return res.json()
  },

  template: async modifiedConfigMethod => {
    const res = await fetchRawls('methodconfigs/template',
      _.mergeAll([authOpts(), jsonBody(modifiedConfigMethod), { signal, method: 'POST' }]))
    return res.json()
  },

  method: (namespace, name, snapshotId) => {
    const root = `methods/${namespace}/${name}/${snapshotId}`

    return {
      get: async () => {
        const res = await fetchAgora(root, _.merge(authOpts(), { signal }))
        return res.json()
      },

      configs: async () => {
        const res = await fetchAgora(`${root}/configurations`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      allConfigs: async () => {
        const res = await fetchAgora(`methods/${namespace}/${name}/configurations`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      toWorkspace: async (workspace, config = {}) => {
        const res = await fetchRawls(`workspaces/${workspace.namespace}/${workspace.name}/methodconfigs`,
          _.mergeAll([authOpts(), jsonBody(_.merge({
            methodRepoMethod: {
              methodUri: `agora://${namespace}/${name}/${snapshotId}`
            },
            name,
            namespace,
            rootEntityType: '',
            prerequisites: {},
            inputs: {},
            outputs: {},
            methodConfigVersion: 1,
            deleted: false
          },
          config.payloadObject
          )), { signal, method: 'POST' }]))
        return res.json()
      }
    }
  }
})


const Submissions = signal => ({
  queueStatus: async () => {
    const res = await fetchRawls('submissions/queueStatus', _.merge(authOpts(), { signal }))
    return res.json()
  },

  cromwellVersion: async () => {
    const res = await fetchOk(`${getConfig().rawlsUrlRoot}/version/executionEngine`, { signal })
    return res.json()
  }
})


const Clusters = signal => ({
  list: async (labels = {}) => {
    const res = await fetchLeo(`api/google/v1/runtimes?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },

  cluster: (project, name) => {
    const root = `api/google/v1/runtimes/${project}/${name}`

    return {
      details: async () => {
        const res = await fetchLeo(root, _.mergeAll([authOpts(), { signal }, appIdentifier]))
        return res.json()
      },
      create: clusterOptions => {
        const body = _.merge(clusterOptions, {
          labels: { saturnAutoCreated: 'true', saturnVersion: version },
          defaultClientId: getConfig().googleClientId,
          userJupyterExtensionConfig: {
            nbExtensions: {
              'saturn-iframe-extension':
                `${window.location.hostname === 'localhost' ? getConfig().devUrlRoot : window.location.origin}/jupyter-iframe-extension.js`
            },
            labExtensions: {},
            serverExtensions: {},
            combinedExtensions: {}
          },
          scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'],
          enableWelder: true
        })
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }, appIdentifier]))
      },

      update: clusterOptions => {
        const body = { ...clusterOptions, allowStop: true }
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'PATCH' }, appIdentifier]))
      },

      start: () => {
        return fetchLeo(`${root}/start`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },

      stop: () => {
        return fetchLeo(`${root}/stop`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },

      delete: deleteDisk => {
        return fetchLeo(`${root}${qs.stringify({ deleteDisk }, { addQueryPrefix: true })}`, _.mergeAll([authOpts(), { signal, method: 'DELETE' }, appIdentifier]))
      }
    }
  },

  notebooks: (project, name) => {
    const root = `proxy/${project}/${name}`

    return {
      oldLocalize: files => {
        return fetchLeo(`notebooks/${project}/${name}/api/localize`, // this is the old root url
          _.mergeAll([authOpts(), jsonBody(files), { signal, method: 'POST' }]))
      },

      localize: entries => {
        const body = { action: 'localize', entries }
        return fetchLeo(`${root}/welder/objects`,
          _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
      },

      setCookie: () => {
        return fetchLeo(`${root}/setCookie`, _.merge(authOpts(), { signal, credentials: 'include' }))
      },

      setStorageLinks: (localBaseDirectory, localSafeModeBaseDirectory, cloudStorageDirectory, pattern) => {
        return fetchLeo(`${root}/welder/storageLinks`,
          _.mergeAll([authOpts(), jsonBody({
            localBaseDirectory,
            localSafeModeBaseDirectory,
            cloudStorageDirectory,
            pattern
          }), { signal, method: 'POST' }]))
      },

      lock: async localPath => {
        try {
          await fetchLeo(`${root}/welder/objects/lock`, _.mergeAll([authOpts(), jsonBody({ localPath }), { signal, method: 'POST' }]))
          return true
        } catch (error) {
          if (error.status === 409) {
            return false
          } else {
            throw error
          }
        }
      }
    }
  }
})


const Disks = signal => ({
  list: async (labels = {}) => {
    const res = await fetchLeo(`api/google/v1/disks${qs.stringify(labels, { addQueryPrefix: true })}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },

  disk: (project, name) => {
    return {
      delete: () => {
        return fetchLeo(`api/google/v1/disks/${project}/${name}`, _.mergeAll([authOpts(), appIdentifier, { signal, method: 'DELETE' }]))
      },
      update: size => {
        return fetchLeo(`api/google/v1/disks/${project}/${name}`, _.mergeAll([authOpts(), jsonBody({ size }), appIdentifier, { signal, method: 'PATCH' }]))
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
  getDataObjectMetadata: async url => {
    const res = await fetchMartha('martha_v2', _.mergeAll([jsonBody({ url }), appIdentifier, { signal, method: 'POST' }]))
    return res.json()
  },

  getSignedUrl: async ({ bucket, object, dataObjectUri }) => {
    const res = await fetchMartha('getSignedUrlV1',
      _.mergeAll([jsonBody({ bucket, object, dataObjectUri }), authOpts(), appIdentifier, { signal, method: 'POST' }]))
    return res.json()
  }
})


const Duos = signal => ({
  getConsent: async orspId => {
    const res = await fetchOrchestration(`/api/duos/consent/orsp/${orspId}`, _.merge(authOpts(), { signal }))
    return res.json()
  }
})

const Metrics = signal => ({
  captureEvent: withErrorIgnoring((event, details = {}) => {
    const body = {
      event,
      properties: {
        ...details,
        appId: 'Saturn',
        hostname: window.location.hostname,
        appPath: Nav.getCurrentRoute().name
      }
    }

    return fetchBard('api/event', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
  }),

  syncProfile: withErrorIgnoring(() => {
    return fetchBard('api/syncProfile', _.merge(authOpts(), { signal, method: 'POST' }))
  })
})

export const Ajax = signal => {
  return {
    User: User(signal),
    Groups: Groups(signal),
    Billing: Billing(signal),
    Workspaces: Workspaces(signal),
    Buckets: Buckets(signal),
    GoogleBilling: GoogleBilling(signal),
    Methods: Methods(signal),
    Submissions: Submissions(signal),
    Clusters: Clusters(signal),
    Dockstore: Dockstore(signal),
    Martha: Martha(signal),
    Duos: Duos(signal),
    Metrics: Metrics(signal),
    Disks: Disks(signal)
  }
}

// Exposing Ajax for use by integration tests (and debugging, or whatever)
window.Ajax = Ajax

export const ajaxCaller = WrappedComponent => {
  return Utils.withDisplayName('ajaxCaller', props => {
    const signal = Utils.useCancellation()
    return h(WrappedComponent, { ...props, ajax: Ajax(signal) })
  })
}
