import { parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { cookiesAcceptedKey } from 'src/components/CookieWarning'
import { Ajax } from 'src/libs/ajax'
import { fetchOk } from 'src/libs/ajax/ajax-common'
import { getLocalStorage, getSessionStorage } from 'src/libs/browser-storage'
import { getConfig } from 'src/libs/config'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import { captureAppcuesEvent } from 'src/libs/events'
import { clearNotification, notify, sessionTimeoutProps } from 'src/libs/notifications'
import { getLocalPref, getLocalPrefForUserId, setLocalPref } from 'src/libs/prefs'
import allProviders from 'src/libs/providers'
import {
  asyncImportJobStore, authStore, azureCookieReadyStore, azurePreviewStore, cookieReadyStore, getUser, requesterPaysProjectStore, userStatus, workspacesStore, workspaceStore
} from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export { getUser }


export const getOidcConfig = () => {
  const metadata = {
    authorization_endpoint: `${getConfig().orchestrationUrlRoot}/oauth2/authorize`,
    token_endpoint: `${getConfig().orchestrationUrlRoot}/oauth2/token`,
    ...(isGoogleAuthority() && {
      userinfo_endpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
      revocation_endpoint: 'https://oauth2.googleapis.com/revoke'
    })
  }
  return {
    authority: `${getConfig().orchestrationUrlRoot}/oauth2/authorize`,
    client_id: authStore.get().oidcConfig.clientId,
    popup_redirect_uri: `${window.origin}/redirect-from-oauth`,
    silent_redirect_uri: `${window.origin}/redirect-from-oauth-silent`,
    metadata,
    prompt: 'consent login',
    scope: 'openid email profile',
    loadUserInfo: isGoogleAuthority(),
    stateStore: new WebStorageStateStore({ store: getLocalStorage() }),
    userStore: new WebStorageStateStore({ store: getLocalStorage() }),
    automaticSilentRenew: true,
    // Leo's setCookie interval is currently 5 min, set refresh auth then 5 min 30 seconds to gurantee that setCookie's token won't expire between 2 setCookie api calls
    accessTokenExpiringNotificationTimeInSeconds: 330,
    includeIdTokenInSilentRenew: true,
    extraQueryParams: { access_type: 'offline' }
  }
}

const isGoogleAuthority = () => {
  return _.startsWith('https://accounts.google.com', authStore.get().oidcConfig.authorityEndpoint)
}

const getAuthInstance = () => {
  return authStore.get().authContext
}

export const signOut = () => {
  // TODO: invalidate runtime cookies https://broadworkbench.atlassian.net/browse/IA-3498
  cookieReadyStore.reset()
  azureCookieReadyStore.reset()
  getSessionStorage().clear()
  azurePreviewStore.set(false)
  const auth = getAuthInstance()
  revokeTokens()
    .finally(() => auth.removeUser())
    .finally(() => auth.clearStaleState())
}

export const signOutAfterSessionTimeout = () => {
  signOut()
  notify('info', 'Session timed out', sessionTimeoutProps)
}

const revokeTokens = async () => {
  const auth = getAuthInstance()
  if (auth.settings.metadata.revocation_endpoint) {
    // revokeTokens can fail if the the token has already been revoked.
    // Recover from invalid_token errors to make sure signOut completes successfully.
    try {
      await auth.revokeTokens()
    } catch (e) {
      if (e.error === 'invalid_token') {
        return null
      } else {
        throw e
      }
    }
  }
}

const getSigninArgs = includeBillingScope => {
  return Utils.cond(
    [includeBillingScope === false, () => ({})],
    // For Google just append the scope to the signin args.
    [isGoogleAuthority(), () => ({ scope: 'openid email profile https://www.googleapis.com/auth/cloud-billing' })],
    // For B2C switch to a dedicated policy endpoint configured for the GCP cloud-billing scope.
    () => ({
      extraQueryParams: { access_type: 'offline', p: getConfig().b2cBillingPolicy },
      extraTokenParams: { p: getConfig().b2cBillingPolicy }
    })
  )
}

export const signIn = async (includeBillingScope = false) => {
  const args = getSigninArgs(includeBillingScope)
  const user = await getAuthInstance().signinPopup(args)

  // For B2C record in the auth store whether we requested the GCP cloud-billing scope since there
  // is no way to determine it after the fact.
  // For Google we don't need to do this since we can inspect the scope directly in the user object.
  if (!isGoogleAuthority()) {
    authStore.update(state => ({ ...state, hasGcpBillingScopeThroughB2C: includeBillingScope }))
  }

  return user
}

export const reloadAuthToken = (includeBillingScope = false) => {
  const args = getSigninArgs(includeBillingScope)
  return getAuthInstance().signinSilent(args).catch(() => false)
}

export const hasBillingScope = () => {
  return Utils.cond(
    // For Google check the scope directly on the user object.
    [isGoogleAuthority(), () => _.includes('https://www.googleapis.com/auth/cloud-billing', getUser().scope)],
    // For B2C check the hasGcpBillingScopeThroughB2C field in the auth store.
    () => authStore.get().hasGcpBillingScopeThroughB2C === true
  )
}

/*
 * Tries to obtain Google Cloud Billing scope silently.

 * This will succeed if the user previously granted the scope for the application, and fail otherwise.
 * Call `ensureBillingScope` to generate a pop-up to prompt the user to grant the scope if needed.
 */
export const tryBillingScope = async () => {
  if (!hasBillingScope()) {
    await reloadAuthToken(true)
  }
}

/*
 * Request Google Cloud Billing scope if necessary.
 *
 * NOTE: Requesting additional scopes may invoke a browser pop-up which the browser might block.
 * If you use ensureBillingScope during page load and the pop-up is blocked, a rejected promise will
 * be returned. In this case, you'll need to provide something for the user to deliberately click on
 * and retry ensureBillingScope in reaction to the click.
 */
export const ensureBillingScope = async () => {
  if (!hasBillingScope()) {
    await signIn(true)
  }
}

const becameRegistered = (oldState, state) => {
  return (oldState.registrationStatus !== userStatus.registeredWithTos && state.registrationStatus === userStatus.registeredWithTos)
}

export const isAuthSettled = ({ isSignedIn, registrationStatus }) => {
  return isSignedIn !== undefined && (!isSignedIn || registrationStatus !== undefined)
}

export const ensureAuthSettled = () => {
  if (isAuthSettled(authStore.get())) {
    return
  }
  return new Promise(resolve => {
    const subscription = authStore.subscribe(state => {
      if (isAuthSettled(state)) {
        resolve()
        subscription.unsubscribe()
      }
    })
  })
}

export const bucketBrowserUrl = id => {
  return `https://console.cloud.google.com/storage/browser/${id}?authuser=${getUser().email}`
}

export const isAzureUser = () => {
  return _.startsWith('https://login.microsoftonline.com', getUser().idp)
}

export const processUser = (user, isSignInEvent) => {
  return authStore.update(state => {
    const isSignedIn = !_.isNil(user)
    const profile = user?.profile
    const userId = profile?.sub

    // The following few lines of code are to handle sign-in failures due to privacy tools.
    if (isSignInEvent === true && state.isSignedIn === false && isSignedIn === false) {
      //if both of these values are false, it means that the user was initially not signed in (state.isSignedIn === false),
      //tried to sign in (invoking processUser) and was still not signed in (isSignedIn === false).
      notify('error', 'Could not sign in', {
        message: 'Click for more information',
        detail: 'If you are using privacy blockers, they may be preventing you from signing in. Please disable those tools, refresh, and try signing in again.',
        timeout: 30000
      })
    }
    return {
      ...state,
      isSignedIn,
      anonymousId: !isSignedIn && state.isSignedIn ? undefined : state.anonymousId,
      registrationStatus: isSignedIn ? state.registrationStatus : undefined,
      termsOfService: initializeTermsOfService(isSignedIn, state),
      profile: isSignedIn ? state.profile : {},
      nihStatus: isSignedIn ? state.nihStatus : undefined,
      fenceStatus: isSignedIn ? state.fenceStatus : {},
      // Load whether a user has input a cookie acceptance in a previous session on this system,
      // or whether they input cookie acceptance previously in this session
      cookiesAccepted: isSignedIn ? state.cookiesAccepted || getLocalPrefForUserId(userId, cookiesAcceptedKey) : undefined,
      isTimeoutEnabled: isSignedIn ? state.isTimeoutEnabled : undefined,
      hasGcpBillingScopeThroughB2C: isSignedIn ? state.hasGcpBillingScopeThroughB2C : undefined,
      user: {
        token: user?.access_token,
        scope: user?.scope,
        id: userId,
        ...(profile ? {
          email: profile.email,
          name: profile.name,
          givenName: profile.givenName,
          familyName: profile.familyName,
          imageUrl: profile.picture,
          idp: profile.idp
        } : {})
      }
    }
  })
}

const initializeTermsOfService = (isSignedIn, state) => {
  return {
    isGracePeriodEnabled: isSignedIn ? state.termsOfService.isGracePeriodEnabled : undefined,
    currentVersion: isSignedIn ? state.termsOfService.currentVersion : undefined,
    userAcceptedVersion: isSignedIn ? state.termsOfService.userAcceptedVersion : undefined,
    userAcceptedTos: isSignedIn ? state.termsOfService.userAcceptedTos : undefined,
    userNeedsToAcceptTos: isSignedIn ? state.termsOfService.userNeedsToAcceptTos : undefined,
  }
}

export const initializeAuth = _.memoize(async () => {
  // Instiante a UserManager directly to populate the logged-in user at app initialization time.
  // All other auth usage should use the AuthContext from authStore.
  const userManager = new UserManager(getOidcConfig())
  processUser(await userManager.getUser())
})

export const initializeClientId = _.memoize(async () => {
  const oidcConfig = await Ajax().OAuth2.getConfiguration()
  authStore.update(state => ({ ...state, oidcConfig }))
})

// This is intended for tests to short circuit the login flow
window.forceSignIn = withErrorReporting('Error forcing sign in', async token => {
  await initializeAuth() // don't want this clobbered when real auth initializes
  const res = await fetchOk(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  authStore.update(state => {
    return {
      ...state,
      isSignedIn: true,
      registrationStatus: undefined,
      isTimeoutEnabled: undefined,
      cookiesAccepted: true,
      profile: {},
      user: {
        token,
        id: data.sub,
        email: data.email,
        name: data.name,
        givenName: data.given_name,
        familyName: data.family_name,
        imageUrl: data.picture
      }
    }
  })
})

authStore.subscribe(withErrorReporting('Error checking registration', async (state, oldState) => {
  const getRegistrationStatus = async () => {
    try {
      const { enabled } = await Ajax().User.getStatus()
      if (enabled) {
        // While initial state is first loading, state.termsOfService.userAcceptedTos will be undefined (it will then be `true` on the
        // second execution of this code, which is still part of the initial rendering).
        return state.termsOfService.userAcceptedTos ? userStatus.registeredWithTos : userStatus.registeredWithoutTos
      } else {
        return userStatus.disabled
      }
    } catch (error) {
      if (error.status === 404) {
        return userStatus.unregistered
      } else {
        throw error
      }
    }
  }
  // need to guard against state.termsOfService not being initialized
  const oldStateAcceptedTos = oldState.termsOfService && oldState.termsOfService.userAcceptedTos
  const newStateAcceptedTos = state.termsOfService && state.termsOfService.userAcceptedTos
  if ((!oldState.isSignedIn && state.isSignedIn) || (!oldStateAcceptedTos && newStateAcceptedTos)) {
    clearNotification(sessionTimeoutProps.id)
    const registrationStatus = await getRegistrationStatus()
    authStore.update(state => ({ ...state, registrationStatus }))
  }
}))

authStore.subscribe(withErrorReporting('Error checking TOS', async (state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    const tosDetails = await Ajax().User.getTermsOfServiceDetails()
    if (_.isNull(tosDetails)) {
      const termsOfService = {
        isGracePeriodEnabled: undefined,
        currentVersion: undefined,
        userAcceptedVersion: undefined,
        userAcceptedTos: false,
        userNeedsToAcceptTos: true,
      }
      authStore.update(state => ({ ...state, termsOfService }))
    } else {
      const userAcceptedTos = !_.isUndefined(tosDetails.currentVersion) ?
        tosDetails.currentVersion === tosDetails.userAcceptedVersion : undefined
      const userNeedsToAcceptTos = !_.isUndefined(userAcceptedTos) ?
        (!userAcceptedTos && !tosDetails.isGracePeriodEnabled) || _.isUndefined(tosDetails.userAcceptedVersion) : false
      const termsOfService = {
        isGracePeriodEnabled: tosDetails.isGracePeriodEnabled,
        currentVersion: tosDetails.currentVersion,
        userAcceptedVersion: tosDetails.userAcceptedVersion,
        userAcceptedTos,
        userNeedsToAcceptTos,
      }
      authStore.update(state => ({ ...state, termsOfService }))
    }
  }
}))

authStore.subscribe(withErrorIgnoring(async (state, oldState) => {
  if (!oldState.termsOfService.userAcceptedTos && state.termsOfService.userAcceptedTos) {
    if (window.Appcues) {
      window.Appcues.identify(state.user.id, {
        dateJoined: parseJSON((await Ajax().User.firstTimestamp()).timestamp).getTime()
      })
      window.Appcues.on('all', captureAppcuesEvent)
    }
  }
}))

authStore.subscribe(state => {
  // We can't guarantee that someone reopening the window is the same user,
  // so we should not persist cookie acceptance across sessions for people signed out
  // Per compliance recommendation, we could probably persist through a session, but
  // that would require a second store in session storage instead of local storage
  if (state.isSignedIn && state.cookiesAccepted !== getLocalPref(cookiesAcceptedKey)) {
    setLocalPref(cookiesAcceptedKey, state.cookiesAccepted)
  }
})

authStore.subscribe(withErrorReporting('Error checking groups for timeout status', async (state, oldState) => {
  if (becameRegistered(oldState, state)) {
    const isTimeoutEnabled = _.some({ groupName: 'session_timeout' }, await Ajax().Groups.list())
    authStore.update(state => ({ ...state, isTimeoutEnabled }))
  }
}))

export const refreshTerraProfile = async () => {
  const profile = Utils.kvArrayToObject((await Ajax().User.profile.get()).keyValuePairs)
  authStore.update(state => ({ ...state, profile }))
}

authStore.subscribe(withErrorReporting('Error loading user profile', async (state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    await refreshTerraProfile()
  }
}))

authStore.subscribe(withErrorReporting('Error loading NIH account link status', async (state, oldState) => {
  if (becameRegistered(oldState, state)) {
    const nihStatus = await Ajax().User.getNihStatus()
    authStore.update(state => ({ ...state, nihStatus }))
  }
}))

authStore.subscribe(withErrorIgnoring(async (state, oldState) => {
  if (becameRegistered(oldState, state)) {
    await Ajax().Metrics.syncProfile()
  }
}))

authStore.subscribe(withErrorIgnoring(async (state, oldState) => {
  if (becameRegistered(oldState, state)) {
    if (state.anonymousId) {
      return await Ajax().Metrics.identify(state.anonymousId)
    }
  }
}))

authStore.subscribe(withErrorReporting('Error loading Framework Services account status', async (state, oldState) => {
  if (becameRegistered(oldState, state)) {
    await Promise.all(_.map(async ({ key }) => {
      const status = await Ajax().User.getFenceStatus(key)
      authStore.update(_.set(['fenceStatus', key], status))
    }, allProviders))
  }
}))

authStore.subscribe((state, oldState) => {
  if (oldState.isSignedIn && !state.isSignedIn) {
    workspaceStore.reset()
    workspacesStore.reset()
    asyncImportJobStore.reset()
    window.Appcues?.reset()
  }
})

workspaceStore.subscribe((newState, oldState) => {
  const getWorkspaceId = ws => ws?.workspace.workspaceId
  if (getWorkspaceId(newState) !== getWorkspaceId(oldState)) {
    requesterPaysProjectStore.reset()
  }
})
