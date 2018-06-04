import _ from 'lodash/fp'
import { Leo, Rawls, Sam } from 'src/libs/ajax'
import * as Config from 'src/libs/config'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


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

authStore.subscribe((state, oldState) => {
  if (!oldState.isSignedIn && state.isSignedIn) {
    Sam.getUserStatus().then(response => {
      if (response.status === 404) {
        return 'unregistered'
      } else if (!response.ok) {
        throw response
      } else {
        return response.json().then(({ enabled: { ldap } }) => ldap ? 'registered' : 'disabled')
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

authStore.subscribe(async (state, oldState) => {
  if (!oldState.registrationStatus !== 'registered' && state.registrationStatus === 'registered') {
    try {
      const userProfile = getBasicProfile()
      const [billingProjects, clusters] = await Promise.all(
        [Rawls.listBillingProjects(), Leo.clustersList()])
      const projectsWithoutClusters = _.difference(
        _.uniq(_.map('projectName', billingProjects)), // in case of being both a user and an admin of a project
        _.map(
          'googleProject',
          _.filter({ creator: userProfile.getEmail(), labels: { saturnAutoCreated: 'true' } }, clusters)
        )
      )

      await Promise.all(projectsWithoutClusters.map(project => {
        return Leo.cluster(project, Utils.generateClusterName()).create({
          'labels': { 'saturnAutoCreated': 'true' },
          'machineConfig': {
            'numberOfWorkers': 0, 'masterMachineType': 'n1-standard-4',
            'masterDiskSize': 500, 'workerMachineType': 'n1-standard-4',
            'workerDiskSize': 500, 'numberOfWorkerLocalSSDs': 0,
            'numberOfPreemptibleWorkers': 0
          },
          'stopAfterCreation': true
        })
      }))
    } catch (error) {
      reportError('Error auto-creating clusters', error)
    }
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
