import * as _ from 'lodash/fp';
import { authOpts, fetchDataRepo, jsonBody } from 'src/libs/ajax/ajax-common';
import {
  convertDatasetAccessRequest,
  convertDatasetParticipantCountRequest,
  DatasetAccessRequest,
  DatasetAccessRequestApi,
  DatasetParticipantCountRequestApi,
  DatasetParticipantCountResponse,
  GetConceptsResponse,
} from 'src/libs/ajax/DatasetBuilder';

export type SnapshotBuilderConcept = {
  id: number;
  name: string;
  count?: number;
  hasChildren: boolean;
};

export type SnapshotBuilderDomainOption = {
  id: number;
  category: string;
  conceptCount?: number;
  participantCount?: number;
  root: SnapshotBuilderConcept;
};

export interface ProgramDataOption {
  kind: 'range' | 'list';
  id: number;
  name: string;
}

export interface ProgramDataRangeOption extends ProgramDataOption {
  kind: 'range';
  min: number;
  max: number;
}

export interface ProgramDataListValue {
  id: number;
  name: string;
}

export interface ProgramDataListOption extends ProgramDataOption {
  kind: 'list';
  values: ProgramDataListValue[];
}

export type SnapshotBuilderFeatureValueGroup = {
  id: number;
  name: string;
  values: string[];
};

export type SnapshotBuilderDatasetConceptSets = {
  name: string;
  featureValueGroupName: string;
};

export type SnapshotBuilderSettings = {
  domainOptions: SnapshotBuilderDomainOption[];
  programDataOptions: (ProgramDataListOption | ProgramDataRangeOption)[];
  featureValueGroups: SnapshotBuilderFeatureValueGroup[];
  datasetConceptSets?: SnapshotBuilderDatasetConceptSets[];
};

export type DatasetModel = {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  properties: any;
  snapshotBuilderSettings?: SnapshotBuilderSettings;
};

type DatasetInclude =
  | 'NONE'
  | 'SCHEMA'
  | 'ACCESS_INFORMATION'
  | 'PROFILE'
  | 'PROPERTIES'
  | 'DATA_PROJECT'
  | 'STORAGE'
  | 'SNAPSHOT_BUILDER_SETTINGS';

export const datasetIncludeTypes: Record<DatasetInclude, DatasetInclude> = {
  NONE: 'NONE',
  SCHEMA: 'SCHEMA',
  ACCESS_INFORMATION: 'ACCESS_INFORMATION',
  PROFILE: 'PROFILE',
  PROPERTIES: 'PROPERTIES',
  DATA_PROJECT: 'DATA_PROJECT',
  STORAGE: 'STORAGE',
  SNAPSHOT_BUILDER_SETTINGS: 'SNAPSHOT_BUILDER_SETTINGS',
};

interface SnapshotDataset {
  id: string;
  name: string;
  secureMonitoringEnabled: boolean;
}

export interface Snapshot {
  id: string;
  name: string;
  source: { dataset: SnapshotDataset }[];
  cloudPlatform: 'azure' | 'gcp';
}

export interface DataRepoContract {
  dataset: (datasetId: string) => {
    details: (include?: DatasetInclude[]) => Promise<DatasetModel>;
    roles: () => Promise<string[]>;
    createSnapshotRequest(request: DatasetAccessRequest): Promise<DatasetAccessRequestApi>;
    getCounts(request: DatasetParticipantCountRequestApi): Promise<DatasetParticipantCountResponse>;
    getConcepts(parent: SnapshotBuilderConcept): Promise<GetConceptsResponse>;
  };
  snapshot: (snapshotId: string) => {
    details: () => Promise<Snapshot>;
    exportSnapshot: () => Promise<{}>;
  };
  job: (jobId: string) => {
    details: () => Promise<{}>;
    result: () => Promise<{}>;
  };
}

const callDataRepo = async (url: string, signal?: AbortSignal) => {
  const res = await fetchDataRepo(url, _.merge(authOpts(), { signal }));
  return await res.json();
};

const callDataRepoPost = async (url: string, signal: AbortSignal | undefined, jsonBodyArg?: object): Promise<any> => {
  const res = await fetchDataRepo(
    url,
    _.mergeAll([authOpts(), jsonBodyArg && jsonBody(jsonBodyArg), { signal, method: 'POST' }])
  );
  return await res.json();
};

export const DataRepo = (signal?: AbortSignal): DataRepoContract => ({
  dataset: (datasetId) => ({
    details: async (include): Promise<DatasetModel> =>
      callDataRepo(`repository/v1/datasets/${datasetId}?include=${_.join(',', include)}`, signal),
    roles: async (): Promise<string[]> => callDataRepo(`repository/v1/datasets/${datasetId}/roles`, signal),
    createSnapshotRequest: async (request): Promise<DatasetAccessRequestApi> =>
      callDataRepoPost(
        `repository/v1/datasets/${datasetId}/createSnapshotRequest`,
        signal,
        convertDatasetAccessRequest(request)
      ),
    getCounts: async (request): Promise<DatasetParticipantCountResponse> =>
      callDataRepoPost(
        `repository/v1/datasets/${datasetId}/snapshotBuilder/count`,
        signal,
        convertDatasetParticipantCountRequest(request)
      ),
    getConcepts: async (parent: SnapshotBuilderConcept): Promise<GetConceptsResponse> =>
      callDataRepo(`repository/v1/datasets/${datasetId}/snapshotBuilder/concepts/${parent.id}`),
  }),
  snapshot: (snapshotId) => {
    return {
      details: async () => callDataRepo(`repository/v1/snapshots/${snapshotId}`, signal),
      exportSnapshot: async () =>
        callDataRepo(`repository/v1/snapshots/${snapshotId}/export?validatePrimaryKeyUniqueness=false`, signal),
    };
  },
  job: (jobId) => ({
    details: async () => callDataRepo(`repository/v1/jobs/${jobId}`, signal),
    result: async () => callDataRepo(`repository/v1/jobs/${jobId}/result`, signal),
  }),
});
