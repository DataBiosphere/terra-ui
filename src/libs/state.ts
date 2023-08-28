import { AnyPromiseFn } from '@terra-ui-packages/core-utils';
import { getLocalStorage, getSessionStorage, staticStorageSlot } from 'src/libs/browser-storage';
import * as Utils from 'src/libs/utils';
import type { WorkspaceWrapper } from 'src/libs/workspace-utils';

export const routeHandlersStore = Utils.atom<unknown[]>([]);

// This is naughty - casting to `any` is ultimately not what we want, but while converting to TypeScript,
// we don't want to cascade into migrating every file all at once,
// so sometimes this is the answer to satisfy the TS compiler
export const authStore = Utils.atom<any>({
  anonymousId: undefined,
  authContext: undefined,
  authTokenMetadata: {
    createdAt: -1,
    expiresAt: -1,
  },
  cookiesAccepted: undefined,
  fenceStatus: {},
  hasGcpBillingScopeThroughB2C: false,
  isAzurePreviewUser: undefined,
  isSignedIn: undefined,
  oidcConfig: {
    authorityEndpoint: undefined,
    clientId: undefined,
  },
  profile: {},
  registrationStatus: undefined,
  sessionId: undefined,
  sessionStartTime: -1,
  termsOfService: {},
  user: {},
});

export const getUser: any = () => authStore.get().user;

export const userStatus = {
  unregistered: 'unregistered',
  registeredWithoutTos: 'registeredWithoutTos',
  registeredWithTos: 'registered',
  disabled: 'disabled',
};

export const cookieReadyStore = Utils.atom(false);
export const azureCookieReadyStore = Utils.atom({
  readyForRuntime: false,
  readyForApp: false,
});

export const lastActiveTimeStore = staticStorageSlot(getLocalStorage(), 'idleTimeout');
lastActiveTimeStore.update((v) => v || {});

export const toggleStateAtom = staticStorageSlot(getSessionStorage(), 'toggleState');
toggleStateAtom.update((v) => v || { notebooksTab: true });

export const azurePreviewStore = staticStorageSlot(getLocalStorage(), 'azurePreview');
azurePreviewStore.update((v) => v || false);

export const notificationStore = Utils.atom<any[]>([]);

export const contactUsActive = Utils.atom(false);

export const workspaceStore = Utils.atom<any>(undefined);

export const workspacesStore = Utils.atom<WorkspaceWrapper[]>([]);

export const rerunFailuresStatus = Utils.atom<unknown>(undefined);

export const errorNotifiedRuntimes = Utils.atom<unknown[]>([]);

export const errorNotifiedApps = Utils.atom<unknown[]>([]);

export const knownBucketRequesterPaysStatuses = Utils.atom({});

export const requesterPaysProjectStore = Utils.atom<unknown>(undefined);

export const runtimesStore = Utils.atom<unknown>(undefined);

export const workflowSelectionStore = Utils.atom({
  key: undefined,
  entityType: undefined,
  entities: undefined,
});

export type AsyncImportJob = {
  jobId: string;
  targetWorkspace: {
    namespace: string;
    name: string;
  };
};

export const asyncImportJobStore = Utils.atom<AsyncImportJob[]>([]);

export const snapshotsListStore = Utils.atom<unknown>(undefined);

export const snapshotStore = Utils.atom<unknown>(undefined);

export const dataCatalogStore = Utils.atom<any[]>([]);

type AjaxOverride = {
  fn: (fetch: AnyPromiseFn) => AnyPromiseFn;
  filter:
    | {
        url: RegExp;
        method?: string;
      }
    | ((...args: any[]) => boolean);
};

declare global {
  interface Window {
    ajaxOverridesStore: Utils.Atom<AjaxOverride[]>;
    configOverridesStore: any;
  }
}

/*
 * Modifies ajax responses for testing purposes.
 * Can be set to an array of objects of the form { fn, filter }.
 * The fn should be a fetch wrapper (oldFetch => newFetch) that modifies the request process. (See ajaxOverrideUtils)
 * If present, filter should be a RegExp that is matched against the url to target specific requests.
 */
export const ajaxOverridesStore = Utils.atom<AjaxOverride[]>([]);
window.ajaxOverridesStore = ajaxOverridesStore;

/*
 * Modifies config settings for testing purposes.
 * Can be set to an object which will be merged with the loaded config object.
 */
export const configOverridesStore = staticStorageSlot(getSessionStorage(), 'config-overrides');
window.configOverridesStore = configOverridesStore;

// enum for status of app proxy url
export const AppProxyUrlStatus = Object.freeze({
  None: 'None',
  Ready: 'Ready',
  Error: 'Error',
});

/*
 * Stores the proxy urls for WDS and Azure Workflows apps for a workspace.
 * Status can be one of None, Ready and Error. The proxy url will be in 'state' field when 'status' is Ready.
 * When 'state' is Error the 'state' field will contain the error that was returned from Leo (if any).
 */
export const workflowsAppStore = Utils.atom({
  workspaceId: undefined,
  wdsProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
  cbasProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
  cromwellProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
});
