import _ from 'lodash/fp'
import { version } from 'src/data/clusters'
import { Billing, Jupyter, User } from 'src/libs/ajax'
import * as Config from 'src/libs/config'
import { clearErrorCode, reportError } from 'src/libs/error'
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
    clearErrorCode('sessionTimeout')
    User.getStatus().then(response => {
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
        [Billing.listProjects(), Jupyter.clustersList()])
      const projectsWithoutClusters = _.difference(
        _.uniq(_.map('projectName', billingProjects)), // in case of being both a user and an admin of a project
        _.map(
          'googleProject',
          _.filter({ creator: userProfile.getEmail() }, clusters)
        )
      )
      const needsUpgrade = _.remove(c => c.labels.saturnVersion === version, clusters)
      await Promise.all([
        ..._.map(project => {
          return Jupyter.cluster(project, Utils.generateClusterName()).create({
            'machineConfig': {
              'numberOfWorkers': 0, 'masterMachineType': 'n1-standard-4',
              'masterDiskSize': 500, 'workerMachineType': 'n1-standard-4',
              'workerDiskSize': 500, 'numberOfWorkerLocalSSDs': 0,
              'numberOfPreemptibleWorkers': 0
            },
            'stopAfterCreation': true
          }).catch(r => r.status === 403 ? r : Promise.reject(r))
        }, projectsWithoutClusters),
        ..._.flatMap(({ googleProject, clusterName, machineConfig, jupyterUserScriptUri }) => {
          return [
            Jupyter.cluster(googleProject, clusterName).delete(),
            Jupyter.cluster(googleProject, Utils.generateClusterName()).create({ machineConfig, jupyterUserScriptUri })
          ]
        }, needsUpgrade)
      ])
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
  sessionStorage.clear()
  getAuthInstance().signOut()
}
