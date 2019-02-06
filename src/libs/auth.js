import _ from 'lodash/fp'
import * as md5 from 'md5'
import { clearNotification, sessionTimeoutProps } from 'src/components/Notifications'
import ProdWhitelist from 'src/data/prod-whitelist'
import { Ajax } from 'src/libs/ajax'
import { getConfig } from 'src/libs/config'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


const getAuthInstance = () => {
  return window.gapi.auth2.getAuthInstance()
}

export const signOut = () => {
  sessionStorage.clear()
  getAuthInstance().signOut()
}

export const reloadAuthToken = () => {
  return getAuthInstance().currentUser.get().reloadAuthResponse().then(() => true, () => false)
}

export const authStore = Utils.atom({
  isSignedIn: undefined,
  registrationStatus: undefined,
  acceptedTos: undefined,
  user: {},
  profile: {}
})

export const getUser = () => {
  return authStore.get().user
}

export const initializeAuth = _.memoize(async () => {
  await new Promise(resolve => window.gapi.load('auth2', resolve))
  await window.gapi.auth2.init({ clientId: getConfig().googleClientId })
  const processUser = user => {
    return authStore.update(state => {
      const authResponse = user.getAuthResponse(true)
      const profile = user.getBasicProfile()
      const isSignedIn = user.isSignedIn()
      return {
        ...state,
        isSignedIn,
        registrationStatus: isSignedIn ? state.registrationStatus : undefined,
        acceptedTos: isSignedIn ? state.acceptedTos : undefined,
        profile: isSignedIn ? state.profile : {},
        user: {
          token: authResponse && authResponse.access_token,
          id: user.getId(),
          ...(profile ? {
            email: profile.getEmail(),
            name: profile.getName(),
            givenName: profile.getGivenName(),
            familyName: profile.getFamilyName(),
            imageUrl: profile.getImageUrl()
          } : {})
        }
      }
    })
  }
  processUser(getAuthInstance().currentUser.get())
  getAuthInstance().currentUser.listen(processUser)
})

// This is intended for tests to short circuit the login flow
window.forceSignIn = async token => {
  const res = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  authStore.update(state => {
    return {
      ...state,
      isSignedIn: true,
      registrationStatus: undefined,
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
}

authStore.subscribe(async (state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    clearNotification(sessionTimeoutProps.id)

    Ajax().User.getStatus().then(response => {
      if (response.status === 404) {
        const isTrustedEmail = _.includes(state.user.email.match(/@.*/)[0],
          ['@broadinstitute.org', '@google.com', '@channing.harvard.edu', '@duke.corp-partner.google.com', '@stanford.corp-partner.google.com'])

        if (getConfig().isProd && !isTrustedEmail && !ProdWhitelist.includes(md5(state.user.email))) {
          return 'unlisted'
        } else {
          return 'unregistered'
        }
      } else if (!response.ok) {
        throw response
      } else {
        return response.json().then(({ enabled }) => enabled ? 'registered' : 'disabled')
      }
    }).then(registrationStatus => {
      authStore.update(state => ({ ...state, registrationStatus }))
    }, error => {
      reportError('Error checking registration', error)
    })
  }
})

authStore.subscribe(async (state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    try {
      const acceptedTos = await Ajax().User.getTosAccepted()
      authStore.update(state => ({ ...state, acceptedTos }))
    } catch (error) {
      reportError('Error checking TOS', error)
    }
  }
})

/**
 * Developers can get access to a user's ID, so a determined person could compare user IDs to
 * hashes to identify a user in our analytics data. We trust our developers to refrain from
 * doing this.
 */
authStore.subscribe((state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    window.newrelic.setCustomAttribute('userGoogleId', state.user.id)
  }
})

export const refreshTerraProfile = async () => {
  const profile = Utils.kvArrayToObject((await Ajax().User.profile.get()).keyValuePairs)
  authStore.update(state => _.set('profile', profile, state))
}

authStore.subscribe((state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    refreshTerraProfile().catch(error => reportError('Error loading user profile', error))
  }
})
