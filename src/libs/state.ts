import { Workspace } from 'src/libs/ajax'
import { staticStorageSlot } from 'src/libs/browser-storage'
import * as Utils from 'src/libs/utils'


export const routeHandlersStore = Utils.atom([])

export const authStore = Utils.atom({
  isSignedIn: undefined,
  anonymousId: undefined,
  registrationStatus: undefined,
  acceptedTos: undefined,
  user: {},
  profile: {},
  fenceStatus: {},
  cookiesAccepted: undefined,
  authContext: undefined,
  oidcConfig: {}
})

export const userStatus = {
  unregistered: 'unregistered',
  registeredWithoutTos: 'registeredWithoutTos',
  registeredWithTos: 'registered',
  disabled: 'disabled'
}

export const cookieReadyStore = Utils.atom(false)
export const azureCookieReadyStore = Utils.atom(false)

export const lastActiveTimeStore = staticStorageSlot(localStorage, 'idleTimeout')
lastActiveTimeStore.update(v => v || {})

export const toggleStateAtom = staticStorageSlot(sessionStorage, 'toggleState')
toggleStateAtom.update(v => v || { notebooksTab: true })

export const notificationStore = Utils.atom([])

export const contactUsActive = Utils.atom(false)

export const workspaceStore = Utils.atom<any>(undefined)

export const workspacesStore = Utils.atom<Workspace[] | undefined>(undefined)

export const rerunFailuresStatus = Utils.atom<any>(undefined)

export const errorNotifiedRuntimes = Utils.atom([])

export const errorNotifiedApps = Utils.atom([])

export const knownBucketRequesterPaysStatuses = Utils.atom({})

export const requesterPaysProjectStore = Utils.atom<any>(undefined)

export const workflowSelectionStore = Utils.atom({
  key: undefined,
  entityType: undefined,
  entities: undefined
})

export const asyncImportJobStore = Utils.atom([])

export const snapshotsListStore = Utils.atom<any>(undefined)

export const snapshotStore = Utils.atom<any>(undefined)

export const dataCatalogStore = Utils.atom<any>(undefined)

/*
 * Modifies ajax responses for testing purposes.
 * Can be set to an array of objects of the form { fn, filter }.
 * The fn should be a fetch wrapper (oldFetch => newFetch) that modifies the request process. (See ajaxOverrideUtils)
 * If present, filter should be a RegExp that is matched against the url to target specific requests.
 */
export const ajaxOverridesStore = Utils.atom<any>(undefined);
(window as any).ajaxOverridesStore = ajaxOverridesStore

/*
 * Modifies config settings for testing purposes.
 * Can be set to an object which will be merged with the loaded config object.
 */
export const configOverridesStore = staticStorageSlot(sessionStorage, 'config-overrides');
(window as any).configOverridesStore = configOverridesStore
