import * as _ from 'lodash/fp';
import {
  convertDatasetAccessRequest,
  convertDatasetParticipantCountRequest,
  convertProgramDataOptionToListOption,
  convertProgramDataOptionToRangeOption,
  DatasetAccessRequest,
  DatasetAccessRequestApi,
  DatasetParticipantCountRequest,
  DatasetParticipantCountResponse,
  GetConceptsResponse,
  ProgramDataListOption,
  ProgramDataRangeOption,
  SearchConceptsResponse,
} from 'src/dataset-builder/DatasetBuilderUtils';
import { authOpts, fetchDataRepo, jsonBody } from 'src/libs/ajax/ajax-common';

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

export interface SnapshotBuilderProgramDataOption {
  kind: 'range' | 'list';
  name: string;
  tableName: string;
  columnName: string;
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
  programDataOptions: SnapshotBuilderProgramDataOption[];
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

export interface ColumnStatisticsModel {
  dataType:
    | 'string'
    | 'boolean'
    | 'bytes'
    | 'date'
    | 'datetime'
    | 'dirref'
    | 'fileref'
    | 'float'
    | 'float64'
    | 'integer'
    | 'int64'
    | 'numeric'
    | 'record'
    | 'text'
    | 'time'
    | 'timestamp';
}

export interface ColumnStatisticsIntOrDoubleModel extends ColumnStatisticsModel {
  dataType: 'float' | 'float64' | 'integer' | 'int64' | 'numeric';
  minValue: number;
  maxValue: number;
}

export interface ColumnStatisticsTextModel extends ColumnStatisticsModel {
  dataType: 'string' | 'text';
  values: ColumnStatisticsTextValue[];
}

interface ColumnStatisticsTextValue {
  value: string;
  count: number;
}

export type JobStatus = 'running' | 'succeeded' | 'failed';

export const jobStatusTypes: Record<JobStatus, JobStatus> = {
  running: 'running',
  succeeded: 'succeeded',
  failed: 'failed',
};

export interface JobModel {
  id: string;
  description?: string;
  job_status: JobStatus;
  status_code: number;
  submitted?: string;
  completed?: string;
  class_name?: string;
}

export interface DataRepoContract {
  dataset: (datasetId: string) => {
    details: (include?: DatasetInclude[]) => Promise<DatasetModel>;
    roles: () => Promise<string[]>;
    queryDatasetColumnStatisticsById: (
      dataOption: SnapshotBuilderProgramDataOption
    ) => Promise<ProgramDataRangeOption | ProgramDataListOption>;
    createSnapshotRequest(request: DatasetAccessRequest): Promise<DatasetAccessRequestApi>;
    getCounts(request: DatasetParticipantCountRequest): Promise<DatasetParticipantCountResponse>;
    getConcepts(parent: SnapshotBuilderConcept): Promise<GetConceptsResponse>;
    // Search returns a list of matching concepts with a domain sorted by participant count. The result is truncated to N concepts.
    searchConcepts(domain: SnapshotBuilderConcept, text: string): Promise<SearchConceptsResponse>;
  };
  snapshot: (snapshotId: string) => {
    details: () => Promise<Snapshot>;
    exportSnapshot: () => Promise<JobModel>;
  };
  job: (jobId: string) => {
    details: () => Promise<JobModel>;
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

const handleProgramDataOptions = async (
  datasetId: string,
  programDataOption: SnapshotBuilderProgramDataOption,
  signal: AbortSignal | undefined
): Promise<ProgramDataRangeOption | ProgramDataListOption> => {
  switch (programDataOption.kind) {
    case 'list':
      return convertProgramDataOptionToListOption(programDataOption);
    case 'range': {
      const statistics: ColumnStatisticsTextModel | ColumnStatisticsIntOrDoubleModel = await callDataRepoPost(
        `repository/v1/datasets/${datasetId}/data/${programDataOption.tableName}/statistics/${programDataOption.columnName}`,
        signal,
        {}
      );
      return convertProgramDataOptionToRangeOption(programDataOption, statistics);
    }
    default:
      throw new Error('Unexpected option');
  }
};
export const DataRepo = (signal?: AbortSignal): DataRepoContract => ({
  dataset: (datasetId) => {
    return {
      details: async (include): Promise<DatasetModel> =>
        callDataRepo(`repository/v1/datasets/${datasetId}?include=${_.join(',', include)}`, signal),
      roles: async (): Promise<string[]> => callDataRepo(`repository/v1/datasets/${datasetId}/roles`, signal),
      createSnapshotRequest: async (request): Promise<DatasetAccessRequestApi> =>
        callDataRepoPost(
          `repository/v1/datasets/${datasetId}/snapshotRequests`,
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
      searchConcepts: async (_domain: SnapshotBuilderConcept, searchText: string): Promise<GetConceptsResponse> =>
        // we use encodeURIComponent to encode special characters like spaces
        callDataRepo(
          `repository/v1/datasets/${datasetId}/snapshotBuilder/concepts/${_domain.name}/${encodeURIComponent(
            searchText
          )}`
        ),
      queryDatasetColumnStatisticsById: (programDataOption) =>
        handleProgramDataOptions(datasetId, programDataOption, signal),
    };
  },
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
