import { addDays, differenceInDays, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { FrameworkServiceLink, ShibbolethLink, UnlinkFenceAccount } from 'src/components/common'
import { cookiesAcceptedKey } from 'src/components/CookieWarning'
import { Ajax, fetchOk } from 'src/libs/ajax'
import { getConfig } from 'src/libs/config'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import { captureAppcuesEvent } from 'src/libs/events'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import { clearNotification, notify, sessionTimeoutProps } from 'src/libs/notifications'
import { getLocalPref, getLocalPrefForUserId, setLocalPref } from 'src/libs/prefs'
import allProviders from 'src/libs/providers'
import {
  asyncImportJobStore, authStore, cookieReadyStore, requesterPaysProjectStore, userStatus, workspacesStore, workspaceStore
} from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const getOidcConfig = () => {
  return {
    authority: `${getConfig().orchestrationUrlRoot}/oauth2/authorize`,
    client_id: getConfig().oidcClientId,
    popup_redirect_uri: `${window.origin}/redirect-from-oauth`,
    silent_redirect_uri: `${window.origin}/redirect-from-oauth-silent`,
    prompt: 'login',
    scope: 'openid email profile',
    metadata: {
      authorization_endpoint: `${getConfig().orchestrationUrlRoot}/oauth2/authorize`,
      token_endpoint: `${getConfig().orchestrationUrlRoot}/oauth2/token`
    },
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    accessTokenExpiringNotificationTimeInSeconds: 300,
    automaticSilentRenew: true,
    includeIdTokenInSilentRenew: true
  }
}

const getAuthInstance = () => {
  return authStore.get().authContext
}

export const signOut = () => {
  // Note: Ideally, we'd actually clear the Leo proxy cookie here, but there's not currently an endpoint to do that.
  // When IA-2236 is done, add that call here.
  cookieReadyStore.reset()
  sessionStorage.clear()
  getAuthInstance().removeUser()
}

const getSigninArgs = includeBillingScope => {
  return includeBillingScope === true ? {
    scope: `
    openid
    email
    profile
    https://www.googleapis.com/auth/cloud-billing
  `.trim().split(/\s+/).join(' ')
  } : {}
}

export const signIn = (includeBillingScope = false) => {
  const args = getSigninArgs(includeBillingScope)
  return getAuthInstance().signinPopup(args).catch(() => false)
}

export const reloadAuthToken = (includeBillingScope = false) => {
  const args = getSigninArgs(includeBillingScope)
  return getAuthInstance().signinSilent(args).catch(() => false)
}

export const handleSilentRenewError = error => {
  if (error.name !== 'ErrorResponse') {
    setTimeout(() => {
      const auth = getAuthInstance()
      if (auth.user && !auth.user.expired) {
        auth.stopSilentRenew()
        auth.startSilentRenew()
      }
    }, 5 * 1000)
  }
}

export const hasBillingScope = () => {
  const scope = getUser().scope
  return scope && scope.includes('https://www.googleapis.com/auth/cloud-billing')
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

export const getUser = () => {
  return authStore.get().user
}

export const bucketBrowserUrl = id => {
  return `https://console.cloud.google.com/storage/browser/${id}?authuser=${getUser().email}`
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
      acceptedTos: isSignedIn ? state.acceptedTos : undefined,
      profile: isSignedIn ? state.profile : {},
      nihStatus: isSignedIn ? state.nihStatus : undefined,
      fenceStatus: isSignedIn ? state.fenceStatus : {},
      // Load whether a user has input a cookie acceptance in a previous session on this system,
      // or whether they input cookie acceptance previously in this session
      cookiesAccepted: isSignedIn ? state.cookiesAccepted || getLocalPrefForUserId(userId, cookiesAcceptedKey) : undefined,
      isTimeoutEnabled: isSignedIn ? state.isTimeoutEnabled : undefined,
      user: {
        token: user?.access_token,
        scope: user?.scope,
        id: userId,
        ...(profile ? {
          email: profile.email,
          name: profile.name,
          givenName: profile.givenName,
          familyName: profile.familyName,
          imageUrl: profile.picture
        } : {})
      }
    }
  })
}

export const initializeAuth = _.memoize(async () => {
  // Instiante a UserManager directly to populate the logged-in user at app initialization time.
  // All other auth usage should use the AuthContext from authStore.
  const userManager = new UserManager(getOidcConfig())
  processUser(await userManager.getUser())
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
        // While initial state is first loading, state.acceptedTos will be undefined (it will then be `true` on the
        // second execution of this code, which is still part of the initial rendering).
        return state.acceptedTos ? userStatus.registeredWithTos : userStatus.registeredWithoutTos
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
  if ((!oldState.isSignedIn && state.isSignedIn) || (!oldState.acceptedTos && state.acceptedTos)) {
    clearNotification(sessionTimeoutProps.id)
    const registrationStatus = await getRegistrationStatus()
    authStore.update(state => ({ ...state, registrationStatus }))
  }
}))

authStore.subscribe(withErrorReporting('Error checking TOS', async (state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    const acceptedTos = await Ajax().User.getTosAccepted()
    authStore.update(state => ({ ...state, acceptedTos }))
  }
}))

authStore.subscribe(withErrorIgnoring(async (state, oldState) => {
  if (!oldState.acceptedTos && state.acceptedTos) {
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

authStore.subscribe((state, oldState) => {
  if (state.nihStatus !== oldState.nihStatus) {
    const notificationId = 'nih-link-warning'
    const now = Date.now()
    const expireTime = state.nihStatus && state.nihStatus.linkExpireTime * 1000
    const expireStatus = Utils.cond(
      [!expireTime, () => null],
      [now >= expireTime, () => 'has expired'],
      [now > expireTime - (1000 * 60 * 60 * 24), () => 'will expire soon']
    )
    if (expireStatus) {
      notify('info', `Your access to NIH Controlled Access workspaces and data ${expireStatus}.`, {
        id: notificationId,
        message: h(Fragment, [
          'To regain access, ',
          h(ShibbolethLink, { style: { color: 'unset', fontWeight: 600, textDecoration: 'underline' } }, ['re-link']),
          ` your eRA Commons / NIH account (${state.nihStatus.linkedNihUsername}) with ${getAppName()}.`
        ])
      })
    } else {
      clearNotification(notificationId)
    }
  }
})

authStore.subscribe(withErrorReporting('Error loading Framework Services account status', async (state, oldState) => {
  if (becameRegistered(oldState, state)) {
    await Promise.all(_.map(async ({ key }) => {
      const status = await Ajax().User.getFenceStatus(key)
      authStore.update(_.set(['fenceStatus', key], status))
    }, allProviders))
  }
}))

authStore.subscribe((state, oldState) => {
  _.forEach(({ key, name }) => {
    const notificationId = `fence-${key}-link-warning`
    const status = state.fenceStatus[key]
    const oldStatus = oldState.fenceStatus[key]
    if (status !== oldStatus) {
      const redirectUrl = `${window.location.origin}/${Nav.getLink('fence-callback')}`
      const now = Date.now()
      const dateOfExpiration = status && addDays(30, parseJSON(status.issued_at))
      const dateFiveDaysBeforeExpiration = dateOfExpiration && addDays(-5, dateOfExpiration)
      const expireStatus = Utils.cond(
        [!dateOfExpiration, () => null],
        [now >= dateOfExpiration, () => 'has expired'],
        [now >= dateFiveDaysBeforeExpiration, () => `will expire in ${differenceInDays(now, dateOfExpiration)} day(s)`]
      )
      if (expireStatus) {
        notify('info', div([
          `Your access to ${name} ${expireStatus}. Log in to `,
          h(FrameworkServiceLink, { linkText: expireStatus === 'has expired' ? 'restore ' : 'renew ', provider: key, redirectUrl }),
          ' your access or ',
          h(UnlinkFenceAccount, { linkText: 'unlink ', provider: { key, name } }),
          ' your account.'
        ]), { id: notificationId })
      } else {
        clearNotification(notificationId)
      }
    }
  }, allProviders)
})

authStore.subscribe((state, oldState) => {
  if (oldState.isSignedIn && !state.isSignedIn) {
    workspaceStore.reset()
    workspacesStore.reset()
    asyncImportJobStore.reset()
  }
})

workspaceStore.subscribe((newState, oldState) => {
  const getWorkspaceId = ws => ws?.workspace.workspaceId
  if (getWorkspaceId(newState) !== getWorkspaceId(oldState)) {
    requesterPaysProjectStore.reset()
  }
})
