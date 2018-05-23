import _ from 'lodash/fp'
import { Sam, Rawls, Leo } from 'src/libs/ajax'
import * as Config from 'src/libs/config'
import * as Utils from 'src/libs/utils'


export const authStore = Utils.atom({
  isSignedIn: undefined,
  isRegistered: undefined
})

export const initializeAuth = _.memoize(async () => {
  await new Promise(resolve => window.gapi.load('auth2', resolve))
  await window.gapi.auth2.init({ clientId: await Config.getGoogleClientId() })
  authStore.update(state => ({ ...state, isSignedIn: getAuthInstance().isSignedIn.get() }))
  getAuthInstance().isSignedIn.listen(isSignedIn => {
    return authStore.update(state => {
      return { ...state, isSignedIn, isRegistered: isSignedIn ? state.isRegistered : undefined }
    })
  })
})

authStore.subscribe((state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    Sam.getUserStatus().then(response => {
      if (response.status === 404) {
        return false
      } else if (!response.ok) {
        throw response
      } else {
        return response.json().then(({ enabled: { ldap } }) => !!ldap)
      }
    }).then(isRegistered => {
      authStore.update(state => ({ ...state, isRegistered }))
    }) // Need to report failure
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

authStore.subscribe(async (state, oldState) => {
  if (!oldState.isRegistered && state.isRegistered) {
    const userProfile = getBasicProfile()
    const [billingProjects, clusters] = await Promise.all(
      [Rawls.listBillingProjects(), Leo.clustersList()])
    const projectsWithoutClusters = _.difference(
      _.uniq(_.map('projectName', billingProjects)), // in case of being both a user and an admin of a project
      _.map(
        'googleProject',
        _.filter({ creator: userProfile.getEmail() }, clusters)
      ),
    )
    projectsWithoutClusters.forEach(project => {
      Leo.cluster(project, Utils.generateClusterName()).create({
        'labels': {},
        'machineConfig': {
          'numberOfWorkers': 0, 'masterMachineType': 'n1-standard-4',
          'masterDiskSize': 500, 'workerMachineType': 'n1-standard-4',
          'workerDiskSize': 500, 'numberOfWorkerLocalSSDs': 0,
          'numberOfPreemptibleWorkers': 0
        },
        'stopAfterCreation': true
      }).catch(error => Utils.log(`Error auto-creating cluster for project ${project}`, error))
    })
  }
})

initializeAuth()

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
  getAuthInstance().signOut()
}
