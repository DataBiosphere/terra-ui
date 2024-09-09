import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts } from 'src/auth/auth-session';
import { fetchDrsHub, fetchGoogleForms, fetchRawls } from 'src/libs/ajax/ajax-common';
import { AzureStorage } from 'src/libs/ajax/AzureStorage';
import { Billing } from 'src/libs/ajax/Billing';
import { Catalog } from 'src/libs/ajax/Catalog';
import { DataRepo } from 'src/libs/ajax/DataRepo';
import { Dockstore } from 'src/libs/ajax/Dockstore';
import { ExternalCredentials } from 'src/libs/ajax/ExternalCredentials';
import { appIdentifier } from 'src/libs/ajax/fetch/fetch-core';
import { FirecloudBucket } from 'src/libs/ajax/firecloud/FirecloudBucket';
import { GoogleStorage } from 'src/libs/ajax/GoogleStorage';
import { Groups } from 'src/libs/ajax/Groups';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { Disks } from 'src/libs/ajax/leonardo/Disks';
import { Runtimes } from 'src/libs/ajax/leonardo/Runtimes';
import { Methods } from 'src/libs/ajax/methods/Methods';
import { Metrics } from 'src/libs/ajax/Metrics';
import { OAuth2 } from 'src/libs/ajax/OAuth2';
import { SamResources } from 'src/libs/ajax/SamResources';
import { Support } from 'src/libs/ajax/Support';
import { TermsOfService } from 'src/libs/ajax/TermsOfService';
import { User } from 'src/libs/ajax/User';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import { CromIAM } from 'src/libs/ajax/workflows-app/CromIAM';
import { CromwellApp } from 'src/libs/ajax/workflows-app/CromwellApp';
import { WorkflowScript } from 'src/libs/ajax/workflows-app/WorkflowScript';
import { WorkspaceData } from 'src/libs/ajax/WorkspaceDataService';
import { WorkspaceManagerResources } from 'src/libs/ajax/WorkspaceManagerResources';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';

const Submissions = (signal?: AbortSignal) => ({
  queueStatus: async () => {
    const res = await fetchRawls('submissions/queueStatus', _.merge(authOpts(), { signal }));
    return res.json();
  },
});

const DrsUriResolver = (signal?: AbortSignal) => ({
  // DRSHub now gets a signed URL instead of Martha
  getSignedUrl: async ({ bucket, object, dataObjectUri, googleProject }) => {
    const res = await fetchDrsHub(
      '/api/v4/gcs/getSignedUrl',
      _.mergeAll([
        jsonBody({ bucket, object, dataObjectUri, googleProject }),
        authOpts(),
        appIdentifier,
        { signal, method: 'POST' },
      ])
    );
    return res.json();
  },

  getDataObjectMetadata: async (url, fields) => {
    const res = await fetchDrsHub(
      '/api/v4/drs/resolve',
      _.mergeAll([jsonBody({ url, fields }), authOpts(), appIdentifier, { signal, method: 'POST' }])
    );
    return res.json();
  },
});

const Surveys = (signal?: AbortSignal) => ({
  submitForm: (formId, data) => fetchGoogleForms(`${formId}/formResponse?${qs.stringify(data)}`, { signal }),
});

export const Ajax = (signal?: AbortSignal) => {
  return {
    Apps: Apps(signal),
    AzureStorage: AzureStorage(signal),
    Billing: Billing(signal),
    Buckets: GoogleStorage(signal),
    Catalog: Catalog(signal),
    Cbas: Cbas(signal),
    CromIAM: CromIAM(signal),
    CromwellApp: CromwellApp(signal),
    DataRepo: DataRepo(signal),
    Disks: Disks(signal),
    Dockstore: Dockstore(signal),
    DrsUriResolver: DrsUriResolver(signal),
    ExternalCredentials: ExternalCredentials(signal),
    FirecloudBucket: FirecloudBucket(signal),
    Groups: Groups(signal),
    Methods: Methods(signal),
    Metrics: Metrics(signal),
    OAuth2: OAuth2(signal),
    Runtimes: Runtimes(signal),
    SamResources: SamResources(signal),
    Submissions: Submissions(signal),
    Support: Support(signal),
    Surveys: Surveys(signal),
    TermsOfService: TermsOfService(signal),
    User: User(signal),
    WorkflowScript: WorkflowScript(signal),
    WorkspaceData: WorkspaceData(signal),
    WorkspaceManagerResources: WorkspaceManagerResources(signal),
    Workspaces: Workspaces(signal),
  };
};

export type AjaxContract = ReturnType<typeof Ajax>;

// Exposing Ajax for use by integration tests (and debugging, or whatever)
(window as any).Ajax = Ajax;
