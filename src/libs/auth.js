import _ from 'lodash/fp'
import * as md5 from 'md5'
import { version } from 'src/data/clusters'
import ProdWhitelist from 'src/data/prod-whitelist'
import { Ajax } from 'src/libs/ajax'
import * as Config from 'src/libs/config'
import { clearErrorCode, reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


export const getAuthInstance = () => {
  return window.gapi.auth2.getAuthInstance()
}

export const getUser = () => {
  return getAuthInstance().currentUser.get()
}

export const getBasicProfile = () => {
  return getUser().getBasicProfile()
}

export const getAuthToken = () => {
  return getUser().getAuthResponse(true).access_token
}

export const signOut = () => {
  sessionStorage.clear()
  getAuthInstance().signOut()
}

export const authStore = Utils.atom({
  isSignedIn: undefined,
  registrationStatus: undefined
})

export const initializeAuth = _.memoize(async () => {
  await new Promise(resolve => window.gapi.load('auth2', resolve))
  await window.gapi.auth2.init({ clientId: await Config.getGoogleClientId() })
  authStore.update(state => ({ ...state, isSignedIn: getAuthInstance().isSignedIn.get() }))
  getAuthInstance().isSignedIn.listen(isSignedIn => {
    return authStore.update(state => {
      return { ...state, isSignedIn, registrationStatus: isSignedIn ? state.registrationStatus : undefined }
    })
  })
})

authStore.subscribe(async (state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    clearErrorCode('sessionTimeout')
    if (await Config.getIsProd() && !ProdWhitelist.includes(md5(getBasicProfile().getEmail()))) {
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
    window.newrelic.setCustomAttribute('userGoogleId', getBasicProfile().getId())
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
      const userProfile = getBasicProfile()
      const [billingProjects, clusters] = await Promise.all([
        Ajax().Billing.listProjects(),
        Ajax().Jupyter.clustersList()
      ])
      const ownClusters = _.filter({ creator: userProfile.getEmail() }, clusters)
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
          return Ajax().Jypyter.cluster(p, Utils.generateClusterName()).create({
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
