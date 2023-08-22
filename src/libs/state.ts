import { AuthContextProps } from 'react-oidc-context';
import { getLocalStorage, getSessionStorage, staticStorageSlot } from 'src/libs/browser-storage';
import * as Utils from 'src/libs/utils';

export const routeHandlersStore = Utils.atom([]);

type RegistrationStatus = 'unregistered' | 'registeredWithoutTos' | 'registered' | 'disabled';

type LinkedAccount = {
  username: string;
  issued_at: string;
};

type TermsOfServiceStatus = {
  permitsSystemUsage: boolean;
  userHasAcceptedLatestTos: boolean;
};

// TODO: Improve this by splitting into multiple types for
// uninitialized state, anonymous users, signed in users, etc.
export type AuthState = {
  anonymousId: string | undefined;
  authContext: AuthContextProps | undefined;
  cookiesAccepted: boolean | undefined;
  fenceStatus: { [provider: string]: LinkedAccount };
  hasGcpBillingScopeThroughB2C?: string | undefined;
  isAzurePreviewUser?: boolean | undefined;
  isSignedIn: boolean | undefined;
  isTimeoutEnabled?: boolean | undefined;
  nihStatus?: {
    linkedNihUsername: string;
    linkExpireTime: number;
  };
  oidcConfig: {
    authorityEndpoint?: string;
    clientId?: string;
  };
  profile: { [key: string]: string };
  registrationStatus: RegistrationStatus | undefined;
  termsOfService: TermsOfServiceStatus | {};
  user: {
    token?: string | undefined;
    scope?: string | undefined;
    id?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    givenName?: string | undefined;
    familyName?: string | undefined;
    imageUrl?: string | undefined;
    idp?: string | undefined;
  };
};

export const authStore = Utils.atom<AuthState>({
  isSignedIn: undefined,
  anonymousId: undefined,
  registrationStatus: undefined,
  termsOfService: {},
  user: {},
  profile: {},
  fenceStatus: {},
  cookiesAccepted: undefined,
  authContext: undefined,
  oidcConfig: {},
  isAzurePreviewUser: undefined,
});

export const getUser = () => authStore.get().user;

export const userStatus: Record<string, RegistrationStatus> = {
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

export const notificationStore = Utils.atom([]);

export const contactUsActive = Utils.atom(false);

export const workspaceStore = Utils.atom();

export const workspacesStore = Utils.atom();

export const rerunFailuresStatus = Utils.atom();

export const errorNotifiedRuntimes = Utils.atom([]);

export const errorNotifiedApps = Utils.atom([]);

export const knownBucketRequesterPaysStatuses = Utils.atom({});

export const requesterPaysProjectStore = Utils.atom();

export const runtimesStore = Utils.atom();

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

export const snapshotsListStore = Utils.atom();

export const snapshotStore = Utils.atom();

export const dataCatalogStore = Utils.atom<any[]>([]);

/*
 * Modifies ajax responses for testing purposes.
 * Can be set to an array of objects of the form { fn, filter }.
 * The fn should be a fetch wrapper (oldFetch => newFetch) that modifies the request process. (See ajaxOverrideUtils)
 * If present, filter should be a RegExp that is matched against the url to target specific requests.
 */
export const ajaxOverridesStore = Utils.atom();
// @ts-expect-error
window.ajaxOverridesStore = ajaxOverridesStore;

/*
 * Modifies config settings for testing purposes.
 * Can be set to an object which will be merged with the loaded config object.
 */
export const configOverridesStore = staticStorageSlot(getSessionStorage(), 'config-overrides');
// @ts-expect-error
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
