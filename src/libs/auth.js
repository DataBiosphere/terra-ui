import _ from 'lodash/fp'
import * as md5 from 'md5'
import { version } from 'src/data/clusters'
import ProdWhitelist from 'src/data/prod-whitelist'
import { Ajax } from 'src/libs/ajax'
import * as Config from 'src/libs/config'
import { clearErrorCode, reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


const getAuthInstance = () => {
  return window.gapi.auth2.getAuthInstance()
}

export const getUser = () => {
  return authStore.get().user
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
  user: {}
})

const initializeAuth = _.memoize(async () => {
  await new Promise(resolve => window.gapi.load('auth2', resolve))
  await window.gapi.auth2.init({ clientId: await Config.getGoogleClientId() })
  const processUser = user => {
    return authStore.update(state => {
      const authResponse = user.getAuthResponse(true)
      const profile = user.getBasicProfile()
      const isSignedIn = user.isSignedIn()
      return {
        ...state,
        isSignedIn,
        registrationStatus: isSignedIn ? state.registrationStatus : undefined,
        user: {
          token: authResponse && authResponse.access_token,
          id: user.getId(),
          email: profile && profile.getEmail(),
          name: profile && profile.getName(),
          givenName: profile && profile.getGivenName(),
          familyName: profile && profile.getFamilyName(),
          imageUrl: profile && profile.getImageUrl()
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
    clearErrorCode('sessionTimeout')
    if (await Config.getIsProd() && !ProdWhitelist.includes(md5(state.user.email))) {
      authStore.update(state => ({ ...state, registrationStatus: 'unlisted' }))
      return
    }

    Ajax().User.getStatus().then(response => {
      if (response.status === 404) {
        return 'unregistered'
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

const basicMachineConfig = {
  'numberOfWorkers': 0, 'masterMachineType': 'n1-standard-4',
  'masterDiskSize': 500, 'workerMachineType': 'n1-standard-4',
  'workerDiskSize': 500, 'numberOfWorkerLocalSSDs': 0,
  'numberOfPreemptibleWorkers': 0
}

authStore.subscribe(async (state, oldState) => {
  if (oldState.registrationStatus !== 'registered' && state.registrationStatus === 'registered') {
    try {
      const [billingProjects, clusters] = await Promise.all([
        Ajax().Billing.listProjects(),
        Ajax().Jupyter.clustersList()
      ])
      const ownClusters = _.filter({ creator: state.user.email }, clusters)
      const googleProjects = _.uniq(_.map('projectName', billingProjects)) // can have duplicates for multiple roles
      const groupedClusters = _.groupBy('googleProject', ownClusters)
      const projectsNeedingCluster = _.filter(p => {
        return !_.some(c => _.toNumber(c.labels.saturnVersion) >= _.toNumber(version), groupedClusters[p])
      }, googleProjects)
      const oldClusters = _.filter(({ labels: { saturnVersion } }) => {
        return _.toNumber(saturnVersion) < _.toNumber(version)
      }, ownClusters)
      await Promise.all([
        ..._.map(p => {
          return Ajax().Jupyter.cluster(p, Utils.generateClusterName()).create({
            machineConfig: _.last(_.sortBy('createdDate', groupedClusters[p])) || basicMachineConfig,
            stopAfterCreation: true
          }).catch(r => r.status === 403 ? r : Promise.reject(r))
        }, projectsNeedingCluster),
        ..._.map(({ googleProject, clusterName }) => {
          return Ajax().Jupyter.cluster(googleProject, clusterName).delete()
        }, oldClusters)
      ])
    } catch (error) {
      reportError('Error auto-creating clusters', error)
    }
  }
})

initializeAuth()
