import { getDefaultProperties } from '@databiosphere/bard-client'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { getDisplayName, tools } from 'src/components/notebook-utils'
import { version } from 'src/data/machines'
import { ensureAuthSettled, getUser } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import { withErrorIgnoring } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { ajaxOverridesStore, authStore, knownBucketRequesterPaysStatuses, requesterPaysProjectStore, workspaceStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { v4 as uuid } from 'uuid'


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

export const canUseWorkspaceProject = async ({ canCompute, workspace: { namespace } }) => {
  return canCompute || _.some(
    ({ projectName, roles }) => projectName === namespace && _.includes('Owner', roles),
    await Ajax().Billing.listProjects()
  )
}

/*
 * Detects errors due to requester pays buckets, and adds the current workspace's billing
 * project if the user has access, retrying the request once if necessary.
 */
const withRequesterPays = wrappedFetch => (url, ...args) => {
  const bucket = /\/b\/([^/?]+)[/?]/.exec(url)[1]
  const workspace = workspaceStore.get()

  const getUserProject = async () => {
    if (!requesterPaysProjectStore.get() && workspace && await canUseWorkspaceProject(workspace)) {
      requesterPaysProjectStore.set(workspace.workspace.googleProject)
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
const fetchDataRepo = withUrlPrefix(`${getConfig().dataRepoUrlRoot}/api/`, fetchOk)
const fetchLeo = withUrlPrefix(`${getConfig().leoUrlRoot}/`, fetchOk)
const fetchDockstore = withUrlPrefix(`${getConfig().dockstoreUrlRoot}/api/`, fetchOk)
const fetchAgora = _.flow(withUrlPrefix(`${getConfig().agoraUrlRoot}/api/v1/`), withAppIdentifier)(fetchOk)
const fetchOrchestration = _.flow(withUrlPrefix(`${getConfig().orchestrationUrlRoot}/`), withAppIdentifier)(fetchOk)
const fetchRex = withUrlPrefix(`${getConfig().rexUrlRoot}/api/`, fetchOk)
const fetchBond = withUrlPrefix(`${getConfig().bondUrlRoot}/`, fetchOk)
const fetchMartha = withUrlPrefix(`${getConfig().marthaUrlRoot}/`, fetchOk)
const fetchBard = withUrlPrefix(`${getConfig().bardRoot}/`, fetchOk)
const fetchEcm = withUrlPrefix(`${getConfig().externalCredsUrlRoot}/`, fetchOk)

const nbName = name => encodeURIComponent(`notebooks/${name}.${tools.Jupyter.ext}`)
const rName = name => encodeURIComponent(`notebooks/${name}.${tools.RStudio.ext}`)

// %23 = '#', %2F = '/'
const dockstoreMethodPath = ({ path, isTool }) => `api/ga4gh/v1/tools/${isTool ? '' : '%23workflow%2F'}${encodeURIComponent(path)}/versions`

/**
 * Only use this if the user has write access to the workspace to avoid proliferation of service accounts in projects containing public workspaces.
 * If we want to fetch a SA token for read access, we must use a "default" SA instead (api/google/user/petServiceAccount/token).
 */
const getServiceAccountToken = Utils.memoizeAsync(async (googleProject, token) => {
  const scopes = ['https://www.googleapis.com/auth/devstorage.full_control']
  const res = await fetchSam(
    `api/google/user/petServiceAccount/${googleProject}/token`,
    _.mergeAll([authOpts(token), jsonBody(scopes), { method: 'POST' }])
  )
  return res.json()
}, { expires: 1000 * 60 * 30, keyFn: (...args) => JSON.stringify(args) })

export const saToken = googleProject => getServiceAccountToken(googleProject, getUser().token)

const getFirstTimeStamp = Utils.memoizeAsync(async token => {
  const res = await fetchRex('firstTimestamps/record', _.mergeAll([authOpts(token), { method: 'POST' }]))
  return res.json()
}, { keyFn: (...args) => JSON.stringify(args) })

const getSnapshotEntityMetadata = Utils.memoizeAsync(async (token, workspaceNamespace, workspaceName, googleProject, dataReference) => {
  const res = await fetchRawls(`workspaces/${workspaceNamespace}/${workspaceName}/entities?billingProject=${googleProject}&dataReference=${dataReference}`, authOpts(token))
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

    //We are not calling Thurloe directly because free credits logic was in orchestration
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

  getSamTosAccepted: async () => {
    try {
      const res = await fetchSam('register/user/v1/termsofservice/status', _.merge(authOpts(), { signal }))
      return res.json()
    } catch (error) {
      if (error.status === 404) {
        return null
      } else if (error.status === 403) {
        return false
      } else {
        throw error
      }
    }
  },

  getTos: async () => {
    const response = await fetchSam('tos/text', _.merge(authOpts(), { signal }))
    return response.text()
  },

  acceptTos: async () => {
    await fetchOk(
      `${getConfig().tosUrlRoot}/user/response`,
      _.mergeAll([authOpts(), { signal, method: 'POST' }, jsonBody({ ...tosData, accepted: true })])
    )
  },

  acceptSamTos: async () => {
    try {
      await fetchSam(
        'register/user/v1/termsofservice',
        _.mergeAll([authOpts(), { signal, method: 'POST' }, jsonBody('app.terra.bio/#terms-of-service')])
      )
    } catch (error) {
      if (error.status !== 404) {
        throw error
      }
    }
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
    const res = await fetchOrchestration('api/nih/callback', _.mergeAll([authOpts(), jsonBody({ jwt: token }), { signal, method: 'POST' }]))
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
      scopes: ['openid', 'google_credentials', 'data', 'user'],
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

  unlinkFenceAccount: provider => {
    return fetchBond(`api/link/v1/${provider}`, _.merge(authOpts(), { signal, method: 'DELETE' }))
  },

  externalAccount: provider => {
    const root = `api/oidc/v1/${provider}`
    const queryParams = {
      scopes: ['openid', 'email', 'ga4gh_passport_v1'],
      redirectUri: `${window.location.hostname === 'localhost' ? getConfig().devUrlRoot : window.location.origin}/ecm-callback`
    }

    return {
      get: async () => {
        try {
          const res = await fetchEcm(root, _.merge(authOpts(), { signal }))
          return res.json()
        } catch (error) {
          if (error.status === 404) {
            return null
          } else {
            throw error
          }
        }
      },

      getAuthUrl: async () => {
        const res = await fetchEcm(`${root}/authorization-url?${qs.stringify(queryParams, { indices: false })}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      getPassport: async () => {
        const res = await fetchEcm(`${root}/passport`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      linkAccount: async (oauthcode, state) => {
        const res = await fetchEcm(`${root}/oauthcode?${qs.stringify({ ...queryParams, oauthcode, state }, { indices: false })}`, _.merge(authOpts(), { signal, method: 'POST' }))
        return res.json()
      },

      unlink: () => {
        return fetchEcm(root, _.merge(authOpts(), { signal, method: 'DELETE' }))
      }
    }
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
      },

      isMember: async () => {
        const res = await fetchSam(`${resourceRoot}/action/use`, _.merge(authOpts(), { signal }))
        return res.json()
      }
    }
  }
})


const Billing = signal => ({
  listProjects: async () => {
    const res = await fetchRawls('billing/v2', _.merge(authOpts(), { signal }))
    return res.json()
  },

  getProject: async projectName => {
    const route = `billing/v2/${projectName}`
    const res = await fetchRawls(route, _.merge(authOpts(), { signal, method: 'GET' }))
    return res.json()
  },

  listAccounts: async () => {
    const res = await fetchRawls('user/billingAccounts', _.merge(authOpts(), { signal }))
    return res.json()
  },

  createProject: async (projectName, billingAccount) => {
    const res = await fetchRawls('billing/v2',
      _.mergeAll([authOpts(), jsonBody({ projectName, billingAccount }), { signal, method: 'POST' }]))
    return res
  },

  changeBillingAccount: async ({ billingProjectName, newBillingAccountName }) => {
    const res = await fetchOrchestration(`api/billing/v2/${billingProjectName}/billingAccount`,
      _.mergeAll([
        authOpts(), { signal, method: 'PUT' },
        jsonBody({ billingAccount: newBillingAccountName })
      ]))
    return res
  },

  removeBillingAccount: async ({ billingProjectName }) => {
    const res = await fetchOrchestration(`api/billing/v2/${billingProjectName}/billingAccount`,
      _.merge(authOpts(), { signal, method: 'DELETE' }))
    return res
  },

  updateSpendConfiguration: async ({ billingProjectName, datasetGoogleProject, datasetName }) => {
    const res = await fetchOrchestration(`api/billing/v2/${billingProjectName}/spendReportConfiguration`,
      _.mergeAll([
        authOpts(), { signal, method: 'PUT' },
        jsonBody({ datasetGoogleProject, datasetName })
      ]))
    return res
  },

  /**
   * Returns the spend report for the given billing project, from 12 AM on the startDate to 11:59 PM on the endDate (UTC). Spend details by
   * Workspace are included.
   *
   * @param billingProjectName
   * @param startDate, a string of the format YYYY-MM-DD, representing the start date of the report.
   * @param endDate a string of the format YYYY-MM-DD, representing the end date of the report.
   * @returns {Promise<*>}
   */
  getSpendReport: async ({ billingProjectName, startDate, endDate }) => {
    const res = await fetchRawls(
      `billing/v2/${billingProjectName}/spendReport?${qs.stringify({ startDate, endDate, aggregationKey: 'Workspace~Category' })}&${qs.stringify({ aggregationKey: 'Category' })}`,
      _.merge(authOpts(), { signal })
    )
    return res.json()
  },

  listProjectUsers: async projectName => {
    const res = await fetchRawls(`billing/v2/${projectName}/members`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  addProjectUser: (projectName, roles, email) => {
    const addRole = role => fetchRawls(
      `billing/v2/${projectName}/members/${role}/${encodeURIComponent(email)}`,
      _.merge(authOpts(), { signal, method: 'PUT' })
    )

    return Promise.all(_.map(addRole, roles))
  },

  removeProjectUser: (projectName, roles, email) => {
    const removeRole = role => fetchRawls(
      `billing/v2/${projectName}/members/${role}/${encodeURIComponent(email)}`,
      _.merge(authOpts(), { signal, method: 'DELETE' })
    )

    return Promise.all(_.map(removeRole, roles))
  },

  changeUserRoles: async (projectName, email, oldRoles, newRoles) => {
    const billing = Billing()
    if (!_.isEqual(oldRoles, newRoles)) {
      await billing.addProjectUser(projectName, _.difference(newRoles, oldRoles), email)
      return billing.removeProjectUser(projectName, _.difference(oldRoles, newRoles), email)
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

const CromIAM = signal => ({
  callCacheDiff: async (thisWorkflow, thatWorkflow) => {
    const { workflowId: thisWorkflowId, callFqn: thisCallFqn, index: thisIndex } = thisWorkflow
    const { workflowId: thatWorkflowId, callFqn: thatCallFqn, index: thatIndex } = thatWorkflow

    const params = {
      workflowA: thisWorkflowId,
      callA: thisCallFqn,
      indexA: (thisIndex !== -1) ? thisIndex : undefined,
      workflowB: thatWorkflowId,
      callB: thatCallFqn,
      indexB: (thatIndex !== -1) ? thatIndex : undefined
    }
    const res = await fetchOrchestration(`api/workflows/v1/callcaching/diff?${qs.stringify(params)}`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  workflowMetadata: async (workflowId, includeKey, excludeKey) => {
    const res = await fetchOrchestration(`api/workflows/v1/${workflowId}/metadata?${qs.stringify({ includeKey, excludeKey }, { arrayFormat: 'repeat' })}`, _.merge(authOpts(), { signal }))
    return res.json()
  }
})


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

  getTags: async (tag, limit) => {
    const params = { q: tag }
    if (limit) {
      params.limit = limit
    }
    const res = await fetchRawls(`workspaces/tags?${qs.stringify(params)}`, _.merge(authOpts(), { signal }))
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

      checkBucketAccess: async (googleProject, bucket, accessLevel) => {
        // Protect against asking for a project-specific pet service account token if user cannot write to the workspace
        if (!Utils.canWrite(accessLevel)) {
          return false
        }

        const res = await fetchBuckets(`storage/v1/b/${bucket}?fields=billing`,
          _.merge(authOpts(await saToken(googleProject)), { signal }))
        return res.json()
      },

      checkBucketLocation: async (googleProject, bucket) => {
        const res = await fetchBuckets(`storage/v1/b/${bucket}?fields=location%2ClocationType`,
          _.merge(authOpts(await saToken(googleProject)), { signal }))

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
        const res = await fetchOrchestration(`api/${root}/acl?inviteUsersNotFound=${inviteNew}`,
          _.mergeAll([authOpts(), jsonBody(aclUpdates), { signal, method: 'PATCH' }]))
        return res.json()
      },

      lock: async () => {
        return await fetchRawls(`${root}/lock`, _.merge(authOpts(), { signal, method: 'PUT' }))
      },

      unlock: async () => {
        return await fetchRawls(`${root}/unlock`, _.merge(authOpts(), { signal, method: 'PUT' }))
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

      listSnapshots: async (limit, offset) => {
        const res = await fetchRawls(`${root}/snapshots/v2?offset=${offset}&limit=${limit}`, _.merge(authOpts(), { signal }))
        // The list snapshots endpoint returns a "snapshot" field that should really be named "snapshotId". Ideally, this should be fixed in the
        // backend, but we've sequestered it here for now.
        return _.update('gcpDataRepoSnapshots', _.map(_.update('attributes', a => ({ ...a, snapshotId: a.snapshot }))), await res.json())
      },

      snapshot: snapshotId => {
        const snapshotPath = `${root}/snapshots/v2/${snapshotId}`

        return {
          details: async () => {
            const res = await fetchRawls(snapshotPath, _.merge(authOpts(), { signal }))
            return res.json()
          },

          update: updateInfo => {
            return fetchRawls(snapshotPath, _.mergeAll([
              authOpts(),
              jsonBody(updateInfo),
              { signal, method: 'PATCH' }
            ]))
          },

          delete: () => {
            return fetchRawls(snapshotPath, _.merge(authOpts(), { signal, method: 'DELETE' }))
          }
        }
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
          },

          updateUserComment: userComment => {
            const payload = { userComment }
            return fetchRawls(submissionPath, _.mergeAll([authOpts(), jsonBody(payload), { signal, method: 'PATCH' }]))
          },

          // NB: This could one day perhaps redirect to CromIAM's 'workflow' like:
          // workflow: workflowId => Ajax(signal).CromIAM.workflow(workflowId)
          // But: Because of the slowness of asking via CromIAM, that's probably a non-starter for right now.
          workflow: workflowId => {
            return {
              metadata: async ({ includeKey, excludeKey }) => {
                const res = await fetchRawls(`${submissionPath}/workflows/${workflowId}?${qs.stringify({
                  includeKey,
                  excludeKey
                }, { arrayFormat: 'repeat' })}`, _.merge(authOpts(), { signal }))
                return res.json()
              }
            }
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

      snapshotEntityMetadata: (googleProject, dataReference) => {
        return getSnapshotEntityMetadata(getUser().token, namespace, name, googleProject, dataReference)
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

      deleteAttributeFromEntities: (entityType, attributeName, entityNames) => {
        const body = _.map(name => ({
          entityType, name, operations: [{ op: 'RemoveAttribute', attributeName }]
        }), entityNames)

        return fetchRawls(`${root}/entities/batchUpsert`, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
      },

      deleteEntityColumn: (type, attributeName) => {
        return fetchRawls(`${root}/entities/${type}?attributeNames=${attributeName}`, _.mergeAll([authOpts(), { signal, method: 'DELETE' }]))
      },

      upsertEntities,

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

      importEntitiesFile: (file, deleteEmptyValues = false) => {
        const formData = new FormData()
        formData.set('entities', file)
        return fetchOrchestration(`api/${root}/importEntities?${qs.stringify({ deleteEmptyValues })}`, _.merge(authOpts(), { body: formData, signal, method: 'POST' }))
      },

      importFlexibleEntitiesFileSynchronous: async (file, deleteEmptyValues = false) => {
        const formData = new FormData()
        formData.set('entities', file)
        const res = await fetchOrchestration(`api/${root}/flexibleImportEntities?${qs.stringify({ deleteEmptyValues, async: false })}`, _.merge(authOpts(), { body: formData, signal, method: 'POST' }))
        return res
      },

      importFlexibleEntitiesFileAsync: async (file, deleteEmptyValues = false) => {
        const formData = new FormData()
        formData.set('entities', file)
        const res = await fetchOrchestration(`api/${root}/flexibleImportEntities?${qs.stringify({ deleteEmptyValues, async: true })}`, _.merge(authOpts(), { body: formData, signal, method: 'POST' }))
        return res.json()
      },

      importJob: async (url, filetype) => {
        const res = await fetchOrchestration(`api/${root}/importJob`, _.mergeAll([authOpts(), jsonBody({ url, filetype }), { signal, method: 'POST' }]))
        return res.json()
      },

      getImportJobStatus: async jobId => {
        const res = await fetchOrchestration(`api/${root}/importJob/${jobId}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      listImportJobs: async isRunning => {
        // ToDo: This endpoint should be deprecated in favor of more generic "importJob" endpoint
        const res = await fetchOrchestration(`api/${root}/importJob?running_only=${isRunning}`, _.merge(authOpts(), { signal }))
        return res.json()
      },

      importSnapshot: async (snapshotId, name, description) => {
        const res = await fetchRawls(`${root}/snapshots/v2`, _.mergeAll([authOpts(), jsonBody({ snapshotId, name, description }), { signal, method: 'POST' }]))
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
      },

      bucketUsage: async () => {
        const res = await fetchRawls(`${root}/bucketUsage`, _.merge(authOpts(), { signal }))
        return res.json()
      }
    }
  }
})


const DataRepo = signal => ({
  getSnapshots: async () => {
    const res = await fetchDataRepo('repository/v1/search/metadata', _.merge(authOpts(), { signal }))
    //  For beta test: if the title length is even, pretend that this is a controlled snapshot.
    return _.map(snapshot => snapshot['dct:title'].length % 2 === 0 ?
      {
        ...snapshot,
        roles: ['discoverer'],
        'TerraDCAT_ap:hasDataUsePermission': 'TerraCore:CC',
        dataSource: {
          storageSystemName: 'the Terra workspace',
          storageSystemId: '',
          storageSourceId: 'testing',
          storageSourceName: 'TARGET_WT_hg38_OpenAccess_GDCDR-12-0_DATA'
        },
        legacyDatasetAttributes: {
          experimentalStrategy: 'Whole Exome',
          cohortDescription: 'Whilms Tumor',
          cohortName: 'TARGET Kidney Tumors Project: Wilms Tumor',
          cohortPhenotype: 'metachronous kidney Wilms\' tumor',
          datasetVersion: 'GDCDR-12-0',
          datasetOwner: 'NCI',
          datasetCustodian: 'Chet Birger',
          noOfSubjects: 'Number of Subjects',
          region: 'Multi-region - US',
          studyDesign: 'Tumor/Norma',
          projectName: 'TARGET'
        }
      } : snapshot, (await res.json())?.result)
  },

  snapshot: snapshotId => {
    return {
      details: async () => {
        const res = await fetchDataRepo(`repository/v1/snapshots/${snapshotId}`, _.merge(authOpts(), { signal }))
        return res.json()
      }
    }
  },

  requestAccess: async id => {
    //TODO: Update this link to hit the real endpoint
    const res = await fetchRawls(`dunno/what/this/is/${id}/requestAccess`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  getPreviewMetadata: async id => {
    const res = await fetchDataRepo(`repository/v1/snapshots/${id}?include=TABLES,DATA_PROJECT`, _.merge(authOpts(), { signal }))
    return res.json()
  },

  getPreviewTable: async ({ id, table, offset, limit }) => {
    const res = await fetchDataRepo(`repository/v1/snapshots/${id}/data/${table}?limit=${limit}&offset=${offset}`, _.merge(authOpts(), { signal }))
    return res.json()
  }
})


const Buckets = signal => ({
  getObject: async (googleProject, bucket, object, params = {}) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}${qs.stringify(params, { addQueryPrefix: true })}`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    ).then(
      res => res.json()
    )
  },

  getObjectPreview: async (googleProject, bucket, object, previewFull = false) => {
    return fetchBuckets(`storage/v1/b/${bucket}/o/${encodeURIComponent(object)}?alt=media`,
      _.mergeAll([
        authOpts(await saToken(googleProject)),
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

  getShowcaseWorkspaces: async () => {
    const res = await fetchOk(`${getConfig().firecloudBucketRoot}/showcase.json`, { signal })
    return res.json()
  },

  listNotebooks: async (googleProject, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    )
    const { items } = await res.json()
    return _.filter(({ name }) => name.endsWith(`.${tools.Jupyter.ext}`), items)
  },

  listAnalyses: async (googleProject, name) => {
    const res = await fetchBuckets(
      `storage/v1/b/${name}/o?prefix=notebooks/`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    )
    const { items } = await res.json()
    return _.filter(({ name }) => name.endsWith(`.${tools.RStudio.ext}`) || name.endsWith(`.${tools.Jupyter.ext}`), items)
  },

  list: async (googleProject, bucket, prefix) => {
    const res = await fetchBuckets(
      `storage/v1/b/${bucket}/o?${qs.stringify({ prefix, delimiter: '/' })}`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    )
    return res.json()
  },

  /**
   * Recursively returns all objects in the specified bucket, iterating through all pages until
   * results have been exhausted and all objects have been collected.
   *
   * @param googleProject
   * @param bucket Name of the bucket in which to look for objects.
   * @param {Object} options to pass into the GCS API. Accepted options are:
   *    prefix: Filter results to include only objects whose names begin with this prefix.
   *    pageToken: A previously-returned page token representing part of the larger set of results to view.
   *    delimiter: Returns results in a directory-like mode, with / being a common value for the delimiter.
   * @returns {Promise<*>}
   * See https://cloud.google.com/storage/docs/json_api/v1/objects/list for additional documentation for underlying GCS API
   */
  listAll: async (googleProject, bucket, { prefix = null, pageToken = null, delimiter = null } = {}) => {
    const res = await fetchBuckets(
      `storage/v1/b/${bucket}/o?${qs.stringify({ prefix, delimiter, pageToken })}`,
      _.merge(authOpts(await saToken(googleProject)), { signal })
    )
    const body = await res.json()
    const items = body.items || []
    const prefixes = body.prefixes || []

    // Get the next page recursively if there is one
    if (body.nextPageToken) {
      const next = await Buckets(signal).listAll(googleProject, bucket, { prefix, pageToken: body.nextPageToken, delimiter })
      return { items: _.concat(items, next.items), prefixes: _.concat(prefixes, next.prefixes) }
    }
    return { items, prefixes }
  },

  delete: async (googleProject, bucket, name) => {
    return fetchBuckets(
      `storage/v1/b/${bucket}/o/${encodeURIComponent(name)}`,
      _.merge(authOpts(await saToken(googleProject)), { signal, method: 'DELETE' })
    )
  },

  upload: async (googleProject, bucket, prefix, file) => {
    return fetchBuckets(
      `upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(prefix + file.name)}`,
      _.merge(authOpts(await saToken(googleProject)), {
        signal, method: 'POST', body: file,
        headers: { 'Content-Type': file.type, 'Content-Length': file.size }
      })
    )
  },

  //TODO: this should be deprecated in favor of the smarter `analysis` set of functions
  notebook: (googleProject, bucket, name) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    const copy = async (newName, newBucket, clearMetadata) => {
      const body = clearMetadata ? { metadata: { lastLockedBy: '' } } : {}
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}/copyTo/b/${newBucket}/o/${nbName(newName)}`,
        _.mergeAll([authOpts(await saToken(googleProject)), jsonBody(body), { signal, method: 'POST' }])
      )
    }
    const doDelete = async () => {
      return fetchBuckets(
        `${bucketUrl}/${nbName(name)}`,
        _.merge(authOpts(await saToken(googleProject)), { signal, method: 'DELETE' })
      )
    }

    const getObject = async () => {
      const res = await fetchBuckets(
        `${bucketUrl}/${nbName(name)}`,
        _.merge(authOpts(await saToken(googleProject)), { signal, method: 'GET' })
      )
      return await res.json()
    }

    return {
      preview: async () => {
        const nb = await fetchBuckets(
          `${bucketUrl}/${encodeURIComponent(`notebooks/${name}`)}?alt=media`,
          _.merge(authOpts(await saToken(googleProject)), { signal })
        ).then(res => res.text())
        return fetchOk(`${getConfig().calhounUrlRoot}/api/convert`,
          _.mergeAll([authOpts(), { signal, method: 'POST', body: nb }])
        ).then(res => res.text())
      },

      copy,

      create: async contents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${nbName(name)}`,
          _.merge(authOpts(await saToken(googleProject)), {
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
  },

  analysis: (googleProject, bucket, name, toolLabel) => {
    const bucketUrl = `storage/v1/b/${bucket}/o`

    const calhounPath = Utils.switchCase(toolLabel,
      [tools.Jupyter.label, () => 'api/convert'], [tools.RStudio.label, () => 'api/convert/rmd'])

    const mimeType = Utils.switchCase(toolLabel,
      [tools.Jupyter.label, () => 'application/x-ipynb+json'], [tools.RStudio.label, () => 'text/plain'])

    const encodeFileName = n => Utils.switchCase(toolLabel,
      [tools.Jupyter.label, () => nbName(getDisplayName(n))], [tools.RStudio.label, () => rName(getDisplayName(n))])

    const copy = async (newName, newBucket, clearMetadata) => {
      const body = clearMetadata ? { metadata: { lastLockedBy: '' } } : {}
      return fetchBuckets(
        `${bucketUrl}/${encodeFileName(name)}/copyTo/b/${newBucket}/o/${encodeFileName(newName)}`,
        _.mergeAll([authOpts(await saToken(googleProject)), jsonBody(body), { signal, method: 'POST' }])
      )
    }

    const doDelete = async () => {
      return fetchBuckets(
        `${bucketUrl}/${encodeFileName(name)}`,
        _.merge(authOpts(await saToken(googleProject)), { signal, method: 'DELETE' })
      )
    }

    const getObject = async () => {
      const res = await fetchBuckets(
        `${bucketUrl}/${encodeFileName(name)}`,
        _.merge(authOpts(await saToken(googleProject)), { signal, method: 'GET' })
      )
      return await res.json()
    }

    return {
      preview: async () => {
        const nb = await fetchBuckets(
          `${bucketUrl}/${encodeFileName(name)}?alt=media`,
          _.merge(authOpts(await saToken(googleProject)), { signal })
        ).then(res => res.text())
        return fetchOk(`${getConfig().calhounUrlRoot}/${calhounPath}`,
          _.mergeAll([authOpts(), { signal, method: 'POST', body: nb }])
        ).then(res => res.text())
      },

      copy,

      create: async textContents => {
        return fetchBuckets(
          `upload/${bucketUrl}?uploadType=media&name=${encodeFileName(name)}`,
          _.merge(authOpts(await saToken(googleProject)), {
            signal, method: 'POST', body: textContents,
            headers: { 'Content-Type': mimeType }
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


const Runtimes = signal => ({
  list: async (labels = {}) => {
    const res = await fetchLeo(`api/google/v1/runtimes?${qs.stringify({ saturnAutoCreated: true, ...labels })}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },

  invalidateCookie: () => {
    return fetchLeo('proxy/invalidateToken', _.merge(authOpts(), { signal }))
  },

  setCookie: () => {
    return fetchLeo('proxy/setCookie', _.merge(authOpts(), { signal, credentials: 'include' }))
  },

  runtime: (project, name) => {
    const root = `api/google/v1/runtimes/${project}/${name}`

    return {
      details: async () => {
        const res = await fetchLeo(root, _.mergeAll([authOpts(), { signal }, appIdentifier]))
        return res.json()
      },
      create: options => {
        const body = _.merge(options, {
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

      update: options => {
        const body = { ...options, allowStop: true }
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'PATCH' }, appIdentifier]))
      },

      start: () => {
        return fetchLeo(`${root}/start`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },

      stop: () => {
        return fetchLeo(`${root}/stop`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },

      delete: deleteDisk => {
        return fetchLeo(`${root}${qs.stringify({ deleteDisk }, { addQueryPrefix: true })}`,
          _.mergeAll([authOpts(), { signal, method: 'DELETE' }, appIdentifier]))
      }
    }
  },

  fileSyncing: (project, name) => {
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

const Apps = signal => ({
  list: async (project, labels = {}) => {
    const res = await fetchLeo(`api/google/v1/apps/${project}?${qs.stringify({ ...labels })}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },
  listWithoutProject: async labels => {
    const res = await fetchLeo(`api/google/v1/apps?${qs.stringify(labels)}`,
      _.mergeAll([authOpts(), appIdentifier, { signal }]))
    return res.json()
  },
  app: (project, name) => {
    const root = `api/google/v1/apps/${project}/${name}`
    return {
      delete: deleteDisk => {
        return fetchLeo(`${root}${qs.stringify({ deleteDisk }, { addQueryPrefix: true })}`,
          _.mergeAll([authOpts(), { signal, method: 'DELETE' }, appIdentifier]))
      },
      create: ({ kubernetesRuntimeConfig, diskName, diskSize, appType, namespace, bucketName, workspaceName }) => {
        const body = {
          labels: {
            saturnWorkspaceNamespace: namespace,
            saturnWorkspaceName: workspaceName
          },
          kubernetesRuntimeConfig,
          diskConfig: {
            name: diskName,
            size: diskSize,
            labels: {
              saturnApplication: appType,
              saturnWorkspaceNamespace: namespace,
              saturnWorkspaceName: workspaceName
            }
          },
          customEnvironmentVariables: {
            WORKSPACE_NAME: workspaceName,
            WORKSPACE_NAMESPACE: namespace,
            WORKSPACE_BUCKET: `gs://${bucketName}`,
            GOOGLE_PROJECT: project
          },
          appType
        }
        return fetchLeo(root, _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }, appIdentifier]))
      },
      pause: () => {
        return fetchLeo(`${root}/stop`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },
      resume: () => {
        return fetchLeo(`${root}/start`, _.mergeAll([authOpts(), { signal, method: 'POST' }, appIdentifier]))
      },
      details: async () => {
        const res = await fetchLeo(root, _.mergeAll([authOpts(), { signal }, appIdentifier]))
        return res.json()
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
        return fetchLeo(`api/google/v1/disks/${project}/${name}`,
          _.mergeAll([authOpts(), jsonBody({ size }), appIdentifier, { signal, method: 'PATCH' }]))
      },
      details: async () => {
        const res = await fetchLeo(`api/google/v1/disks/${project}/${name}`,
          _.mergeAll([authOpts(), appIdentifier, { signal, method: 'GET' }]))
        return res.json()
      }
    }
  }
})

const Dockstore = signal => ({
  getWdl: async ({ path, version, isTool }) => {
    const res = await fetchDockstore(`${dockstoreMethodPath({ path, isTool })}/${encodeURIComponent(version)}/WDL/descriptor`, { signal })
    const { url } = await res.json()
    return fetchOk(url, { signal }).then(res => res.text())
  },

  getVersions: async ({ path, isTool }) => {
    const res = await fetchDockstore(dockstoreMethodPath({ path, isTool }), { signal })
    return res.json()
  }
})


const Martha = signal => ({
  getDataObjectMetadata: async (url, fields) => {
    const res = await fetchMartha(
      'martha_v3',
      _.mergeAll([jsonBody({ url, fields }), authOpts(), appIdentifier, { signal, method: 'POST' }])
    )
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
  captureEvent: withErrorIgnoring(async (event, details = {}) => {
    await ensureAuthSettled()
    const { isSignedIn, registrationStatus } = authStore.get() // NOTE: This is intentionally read after ensureAuthSettled
    const isRegistered = isSignedIn && registrationStatus === 'registered'
    if (!isRegistered) {
      authStore.update(_.update('anonymousId', id => {
        return id || uuid()
      }))
    }
    const body = {
      event,
      properties: {
        ...details,
        distinct_id: isRegistered ? undefined : authStore.get().anonymousId,
        appId: 'Saturn',
        hostname: window.location.hostname,
        appPath: Nav.getCurrentRoute().name,
        ...getDefaultProperties()
      }
    }

    return fetchBard('api/event', _.mergeAll([isRegistered ? authOpts() : undefined, jsonBody(body), { signal, method: 'POST' }]))
  }),

  syncProfile: withErrorIgnoring(() => {
    return fetchBard('api/syncProfile', _.merge(authOpts(), { signal, method: 'POST' }))
  }),

  identify: withErrorIgnoring(anonId => {
    const body = { anonId }
    return fetchBard('api/identify', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]))
  })
})

export const Ajax = signal => {
  return {
    User: User(signal),
    Groups: Groups(signal),
    Billing: Billing(signal),
    Workspaces: Workspaces(signal),
    DataRepo: DataRepo(signal),
    Buckets: Buckets(signal),
    GoogleBilling: GoogleBilling(signal),
    Methods: Methods(signal),
    Submissions: Submissions(signal),
    Runtimes: Runtimes(signal),
    Apps: Apps(signal),
    Dockstore: Dockstore(signal),
    Martha: Martha(signal),
    Duos: Duos(signal),
    Metrics: Metrics(signal),
    Disks: Disks(signal),
    CromIAM: CromIAM(signal)
  }
}

// Exposing Ajax for use by integration tests (and debugging, or whatever)
window.Ajax = Ajax
