import { AnyPromiseFn, Atom, atom } from '@terra-ui-packages/core-utils';
import { UserManager } from 'oidc-client-ts';
import { AuthContextProps } from 'react-oidc-context';
import { Dataset } from 'src/libs/ajax/Catalog';
import { OidcConfig, OidcUser } from 'src/libs/ajax/OAuth2';
import { BondFenceStatusResponse, NihDatasetPermission } from 'src/libs/ajax/User';
import { AuthTokenState } from 'src/libs/auth';
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
  firstName: string | undefined;
  lastName: string | undefined;
  institute: string | undefined;
  contactEmail: string | undefined;
  title: string | undefined;
  department: string | undefined;
  interestInTerra: string | undefined;
  programLocationCity: string | undefined;
  programLocationState: string | undefined;
  programLocationCountry: string | undefined;
  starredWorkspaces: string | undefined;
};

export type TerraUserRegistrationStatus =
  // User is logged in through B2C but has not registered in Terra.
  | 'unregistered'
  // User has registered in Terra but has not accepted the terms of service.
  | 'registeredWithoutTos'
  // User has registered in Terra and accepted the terms of service.
  | 'registered'
  // User's account has been disabled.
  | 'disabled'
  // Registration status has not yet been determined.
  | 'uninitialized';

export type TermsOfServiceStatus = {
  permitsSystemUsage: boolean | undefined;
  userHasAcceptedLatestTos: boolean | undefined;
};

export type TokenMetadata = {
  token: string | undefined; // do not log or send this to mixpanel
  id: string | undefined;
  createdAt: number;
  expiresAt: number;
  totalTokensUsedThisSession: number;
  totalTokenLoadAttemptsThisSession: number;
};

export type NihStatus = {
  linkedNihUsername: string;
  linkExpireTime: number;
  datasetPermissions: NihDatasetPermission[];
};

export type Initializable<T> = T | 'uninitialized';

export type SignInStatus = Initializable<'signedIn' | 'signedOut'>;

export type AuthState = {
  anonymousId: string | undefined;
  authTokenMetadata: TokenMetadata;
  cookiesAccepted: boolean | undefined;
  fenceStatus: FenceStatus;
  hasGcpBillingScopeThroughB2C: boolean | undefined;
  signInStatus: SignInStatus;
  isTimeoutEnabled?: boolean | undefined;
  nihStatus?: NihStatus;
  nihStatusLoaded: boolean;
  profile: TerraUserProfile;
  refreshTokenMetadata: TokenMetadata;
  registrationStatus: TerraUserRegistrationStatus;
  sessionId?: string | undefined;
  sessionStartTime: number;
  termsOfService: TermsOfServiceStatus;
  terraUser: TerraUser;
};

export type FenceStatus = {
  [key: string]: BondFenceStatusResponse;
};

export const authStore: Atom<AuthState> = atom<AuthState>({
  anonymousId: undefined,
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
  signInStatus: 'uninitialized',
  nihStatusLoaded: false,
  profile: {
    firstName: undefined,
    lastName: undefined,
    contactEmail: undefined,
    title: undefined,
    institute: undefined,
    department: undefined,
    programLocationCity: undefined,
    programLocationState: undefined,
    programLocationCountry: undefined,
    interestInTerra: undefined,
    starredWorkspaces: undefined,
  },
  refreshTokenMetadata: {
    token: undefined,
    id: undefined,
    createdAt: -1,
    expiresAt: -1,
    totalTokenLoadAttemptsThisSession: 0,
    totalTokensUsedThisSession: 0,
  },
  registrationStatus: 'uninitialized',
  sessionId: undefined,
  sessionStartTime: -1,
  termsOfService: {
    permitsSystemUsage: undefined,
    userHasAcceptedLatestTos: undefined,
  },
  terraUser: {
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
export const getTerraUser = (): TerraUser => authStore.get().terraUser;

export const getSessionId = () => authStore.get().sessionId;

export type OidcState = {
  authContext: AuthContextProps | undefined;
  authTokenState: AuthTokenState | undefined;
  user: OidcUser | undefined;
  userManager: UserManager | undefined;
  config: OidcConfig;
};

export const oidcStore: Atom<OidcState> = atom<OidcState>({
  authContext: undefined,
  authTokenState: undefined,
  user: undefined,
  userManager: undefined,
  config: {
    authorityEndpoint: undefined,
    clientId: undefined,
  },
});

export const cookieReadyStore = atom(false);
export const azureCookieReadyStore = atom({
  readyForRuntime: false,
  readyForApp: false,
});

export const lastActiveTimeStore = staticStorageSlot(getLocalStorage(), 'idleTimeout');
lastActiveTimeStore.update((v) => v || {});

export const toggleStateAtom = staticStorageSlot(getSessionStorage(), 'toggleState');
toggleStateAtom.update((v) => v || { notebooksTab: true });

export const azurePreviewStore: Atom<boolean> = staticStorageSlot(getLocalStorage(), 'azurePreview');
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

export const dataCatalogStore = atom<Dataset[]>([]);

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
