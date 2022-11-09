import _ from 'lodash/fp'
import { getUser } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import { ajaxOverridesStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const authOpts = (token = getUser().token) => ({ headers: { Authorization: `Bearer ${token}` } })
export const jsonBody = body => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
export const appIdentifier = { headers: { 'X-App-ID': 'Saturn' } }
export const withUrlPrefix = _.curry((prefix, wrappedFetch) => (path, ...args) => {
  return wrappedFetch(prefix + path, ...args)
})

export const withRetryOnError = _.curry((shouldNotRetryFn, wrappedFetch) => async (...args) => {
  const timeout = 5000
  const somePointInTheFuture = Date.now() + timeout
  const maxDelayIncrement = 1500
  const minDelay = 500

  while (Date.now() < somePointInTheFuture) {
    const until = Math.random() * maxDelayIncrement + minDelay
    try {
      return await Utils.withDelay(until, wrappedFetch)(...args)
    } catch (error) {
      if (shouldNotRetryFn(error)) {
        throw error
      }
      // ignore error will retry
    }
  }
  return wrappedFetch(...args)
})

const withAppIdentifier = wrappedFetch => (url, options) => {
  return wrappedFetch(url, _.merge(options, appIdentifier))
}

export const checkRequesterPaysError = async response => {
  if (response.status === 400) {
    const data = await response.text()
    const requesterPaysError = _.includes('requester pays', data)
    return Object.assign(new Response(new Blob([data]), response), { requesterPaysError })
  } else {
    return Object.assign(response, { requesterPaysError: false })
  }
}

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


export const fetchOk = _.flow(withInstrumentation, withCancellation, withErrorRejection)(fetch)
export const fetchLeo = withUrlPrefix(`${getConfig().leoUrlRoot}/`, fetchOk)
export const fetchSam = _.flow(withUrlPrefix(`${getConfig().samUrlRoot}/`), withAppIdentifier)(fetchOk)
export const fetchRawls = _.flow(withUrlPrefix(`${getConfig().rawlsUrlRoot}/api/`), withAppIdentifier)(fetchOk)
export const fetchBillingProfileManager = _.flow(withUrlPrefix(`${getConfig().billingProfileManagerUrlRoot}/api/`), withAppIdentifier)(fetchOk)
export const fetchWorkspaceManager = _.flow(withUrlPrefix(`${getConfig().workspaceManagerUrlRoot}/api/`), withAppIdentifier)(fetchOk)
export const fetchCatalog = withUrlPrefix(`${getConfig().catalogUrlRoot}/api/`, fetchOk)
export const fetchDataRepo = withUrlPrefix(`${getConfig().dataRepoUrlRoot}/api/`, fetchOk)
export const fetchDockstore = withUrlPrefix(`${getConfig().dockstoreUrlRoot}/api/`, fetchOk)
export const fetchAgora = _.flow(withUrlPrefix(`${getConfig().agoraUrlRoot}/api/v1/`), withAppIdentifier)(fetchOk)
export const fetchOrchestration = _.flow(withUrlPrefix(`${getConfig().orchestrationUrlRoot}/`), withAppIdentifier)(fetchOk)
export const fetchRex = withUrlPrefix(`${getConfig().rexUrlRoot}/api/`, fetchOk)
export const fetchBond = withUrlPrefix(`${getConfig().bondUrlRoot}/`, fetchOk)
export const fetchMartha = withUrlPrefix(`${getConfig().marthaUrlRoot}/`, fetchOk)
export const fetchDrsHub = withUrlPrefix(`${getConfig().drsHubUrlRoot}/`, fetchOk)
export const fetchBard = withUrlPrefix(`${getConfig().bardRoot}/`, fetchOk)
export const fetchEcm = withUrlPrefix(`${getConfig().externalCredsUrlRoot}/`, fetchOk)
export const fetchGoogleForms = withUrlPrefix('https://docs.google.com/forms/u/0/d/e/', fetchOk)
export const fetchWDS = _.flow(withUrlPrefix(`${getConfig().wdsUrlRoot}/`), withAppIdentifier)(fetchOk)
