import { AnyPromiseFn, Atom, atom } from '@terra-ui-packages/core-utils';
import { AuthContextProps } from 'react-oidc-context';
import { OidcUser } from 'src/libs/auth';
import { getLocalStorage, getSessionStorage, staticStorageSlot } from 'src/libs/browser-storage';
import type { WorkspaceWrapper } from 'src/libs/workspace-utils';

export const routeHandlersStore = atom<unknown[]>([]);

export type TerraUser = {
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

export type TerraUserProfile = {
  institute: string | undefined;
  title: string | undefined;
  department: string | undefined;
  interestInTerra: string | undefined;
};

export type TokenMetadata = {
  token: string | undefined; // do not log or send this to mixpanel
  id: string | undefined;
  createdAt: number;
  expiresAt: number;
  totalTokensUsedThisSession: number;
  totalTokenLoadAttemptsThisSession: number;
};

export type AuthState = {
  anonymousId: string | undefined;
  authContext: AuthContextProps | undefined;
  authTokenMetadata: TokenMetadata;
  cookiesAccepted: boolean | undefined;
  fenceStatus: {};
  hasGcpBillingScopeThroughB2C: boolean | undefined;
  isSignedIn: boolean | undefined;
  isTimeoutEnabled?: boolean | undefined;
  nihStatus?: {
    linkedNihUsername: string;
    linkExpireTime: number;
  };
  oidcUser: OidcUser | undefined;
  oidcConfig: {
    authorityEndpoint?: string;
    clientId?: string;
  };
  // props in the TerraUserProfile are always present, but there may be more props
  profile: TerraUserProfile & any;
  refreshTokenMetadata: TokenMetadata;
  registrationStatus: any;
  sessionId?: string | undefined;
  sessionStartTime: number;
  termsOfService: {};
  user: TerraUser;
};

export const authStore: Atom<AuthState> = atom<AuthState>({
  anonymousId: undefined,
  authContext: undefined,
  authTokenMetadata: {
    token: undefined,
    id: undefined,
    createdAt: -1,
    expiresAt: -1,
    totalTokenLoadAttemptsThisSession: 0,
    totalTokensUsedThisSession: 0,
  },
  cookiesAccepted: undefined,
  fenceStatus: {},
  hasGcpBillingScopeThroughB2C: false,
  isSignedIn: undefined,
  oidcConfig: {
    authorityEndpoint: undefined,
    clientId: undefined,
  },
  oidcUser: undefined,
  profile: {
    institute: undefined,
    title: undefined,
    department: undefined,
    interestInTerra: undefined,
  },
  refreshTokenMetadata: {
    token: undefined,
    id: undefined,
    createdAt: -1,
    expiresAt: -1,
    totalTokenLoadAttemptsThisSession: 0,
    totalTokensUsedThisSession: 0,
  },
  registrationStatus: undefined,
  sessionId: undefined,
  sessionStartTime: -1,
  termsOfService: {},
  user: {
    token: undefined,
    scope: undefined,
    id: undefined,
    email: undefined,
    name: undefined,
    givenName: undefined,
    familyName: undefined,
    imageUrl: undefined,
    idp: undefined,
  },
});

export const getUser = (): TerraUser => authStore.get().user;

export const getSessionId = () => authStore.get().sessionId;

export const userStatus = {
  unregistered: 'unregistered',
  registeredWithoutTos: 'registeredWithoutTos',
  registeredWithTos: 'registered',
  disabled: 'disabled',
};

export const cookieReadyStore = atom(false);
export const azureCookieReadyStore = atom({
  readyForRuntime: false,
  readyForApp: false,
});

export const lastActiveTimeStore = staticStorageSlot(getLocalStorage(), 'idleTimeout');
lastActiveTimeStore.update((v) => v || {});

export const toggleStateAtom = staticStorageSlot(getSessionStorage(), 'toggleState');
toggleStateAtom.update((v) => v || { notebooksTab: true });

export const azurePreviewStore = staticStorageSlot(getLocalStorage(), 'azurePreview');
azurePreviewStore.update((v) => v || false);

export const notificationStore = atom<any[]>([]);

export const contactUsActive = atom(false);

export const workspaceStore = atom<any>(undefined);

export const workspacesStore = atom<WorkspaceWrapper[]>([]);

export const rerunFailuresStatus = atom<unknown>(undefined);

export const errorNotifiedRuntimes = atom<unknown[]>([]);

export const errorNotifiedApps = atom<unknown[]>([]);

export const knownBucketRequesterPaysStatuses = atom({});

export const requesterPaysProjectStore = atom<unknown>(undefined);

export const runtimesStore = atom<unknown>(undefined);

export const workflowSelectionStore = atom({
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

export const asyncImportJobStore = atom<AsyncImportJob[]>([]);

export const snapshotsListStore = atom<unknown>(undefined);

export const snapshotStore = atom<unknown>(undefined);

export const dataCatalogStore = atom<any[]>([]);

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
    ajaxOverridesStore: Atom<AjaxOverride[]>;
    configOverridesStore: any;
  }
}

/*
 * Modifies ajax responses for testing purposes.
 * Can be set to an array of objects of the form { fn, filter }.
 * The fn should be a fetch wrapper (oldFetch => newFetch) that modifies the request process. (See ajaxOverrideUtils)
 * If present, filter should be a RegExp that is matched against the url to target specific requests.
 */
export const ajaxOverridesStore = atom<AjaxOverride[]>([]);
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
export const workflowsAppStore = atom({
  workspaceId: undefined,
  wdsProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
  cbasProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
  cromwellProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
});
