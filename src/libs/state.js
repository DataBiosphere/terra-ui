import * as Utils from 'src/libs/utils'


export const routeHandlersStore = Utils.atom([])

export const authStore = Utils.atom({
  isSignedIn: undefined,
  registrationStatus: undefined,
  acceptedTos: undefined,
  user: {},
  profile: {}
})

export const toggleStateAtom = Utils.atom({ notebooksTab: true })

export const freeCreditsActive = Utils.atom(false)

export const notificationStore = Utils.atom([])

export const contactUsActive = Utils.atom(false)

export const workspaceStore = Utils.atom()

export const workspacesStore = Utils.atom()

export const rerunFailuresStatus = Utils.atom()

export const errorNotifiedClusters = Utils.atom([])

export const requesterPaysBuckets = Utils.atom([])

export const requesterPaysProjectStore = Utils.atom()

export const workflowSelectionStore = Utils.atom({
  key: undefined,
  entityType: undefined,
  entities: undefined
})

/*
 * Modifies ajax responses for testing purposes.
 * Can be set to an array of objects of the form { fn, filter }.
 * The fn should be a fetch wrapper (oldFetch => newFetch) that modifies the request process. (See ajaxOverrideUtils)
 * If present, filter should be a RegExp that is matched against the url to target specific requests.
 */
export const ajaxOverridesStore = Utils.atom()
window.ajaxOverridesStore = ajaxOverridesStore

/*
 * Modifies config settings for testing purposes.
 * Can be set to an object which will be merged with the loaded config object.
 */
export const configOverridesStore = Utils.atom()
window.configOverridesStore = configOverridesStore
