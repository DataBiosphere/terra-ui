import * as _ from 'lodash/fp';
import {
  convertDatasetAccessRequest,
  convertDatasetParticipantCountRequest,
  DatasetAccessRequest,
  DatasetParticipantCountRequest,
} from 'src/dataset-builder/DatasetBuilderUtils';
import { authOpts, fetchDataRepo, jsonBody } from 'src/libs/ajax/ajax-common';

/** API types represent the data of UI types in the format expected by the backend.
 * They are generally subsets or mappings of the UI types. */

export type SnapshotBuilderConcept = {
  id: number;
  name: string;
  code: string;
  count: number;
  hasChildren: boolean;
};

export type SnapshotBuilderOptionTypeNames = 'list' | 'range' | 'domain';

export interface SnapshotBuilderOption {
  kind: SnapshotBuilderOptionTypeNames;
  name: string;
  id: number;
  tableName: string;
  columnName: string;
}

export interface SnapshotBuilderProgramDataOption extends SnapshotBuilderOption {
  kind: 'range' | 'list';
}

export interface SnapshotBuilderProgramDataListItem {
  name: string;
  id: number;
}

export interface SnapshotBuilderProgramDataListOption extends SnapshotBuilderProgramDataOption {
  kind: 'list';
  values: SnapshotBuilderProgramDataListItem[];
}

export interface SnapshotBuilderProgramDataRangeOption extends SnapshotBuilderProgramDataOption {
  kind: 'range';
  min: number;
  max: number;
}

export interface SnapshotBuilderDomainOption extends SnapshotBuilderOption {
  kind: 'domain';
  root: SnapshotBuilderConcept;
}

interface DatasetBuilderType {
  name: string;
}

export interface SnapshotBuilderDatasetConceptSet extends DatasetBuilderType {
  featureValueGroupName: string;
}

export type SnapshotBuilderSettings = {
  domainOptions: SnapshotBuilderDomainOption[];
  programDataOptions: (SnapshotBuilderProgramDataListOption | SnapshotBuilderProgramDataRangeOption)[];
  featureValueGroups: SnapshotBuilderFeatureValueGroup[];
  datasetConceptSets?: SnapshotBuilderDatasetConceptSet[];
};

export interface SnapshotBuilderCriteria {
  // This is the ID for either the domain or the program data option
  id: number;
  kind: SnapshotBuilderOptionTypeNames;
}

export interface SnapshotBuilderDomainCriteria extends SnapshotBuilderCriteria {
  kind: 'domain';
  // This is the id for the selected concept
  conceptId: number;
}

export interface SnapshotBuilderProgramDataRangeCriteria extends SnapshotBuilderCriteria {
  kind: 'range';
  low: number;
  high: number;
}

export interface SnapshotBuilderProgramDataListCriteria extends SnapshotBuilderCriteria {
  kind: 'list';
  values: number[];
}

export interface SnapshotBuilderCriteriaGroup {
  name: string;
  criteria: SnapshotBuilderCriteria[];
  mustMeet: boolean;
  meetAll: boolean;
}

export interface SnapshotBuilderCohort extends DatasetBuilderType {
  criteriaGroups: SnapshotBuilderCriteriaGroup[];
}

export type SnapshotBuilderFeatureValueGroup = {
  name: string;
  values: string[];
};

export type SnapshotBuilderRequest = {
  cohorts: SnapshotBuilderCohort[];
  conceptSets: SnapshotBuilderDatasetConceptSet[];
  valueSets: SnapshotBuilderFeatureValueGroup[];
};

export type SnapshotAccessRequest = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: SnapshotBuilderRequest;
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

export interface SnapshotBuilderGetConceptsResponse {
  result: SnapshotBuilderConcept[];
}

export interface SnapshotBuilderGetConceptHierarchyResponse {
  result: SnapshotBuilderParentConcept[];
}

export interface SnapshotAccessRequestResponse {
  id: string; // uuid
  datasetId: string; // uuid
  snapshotId: string; // uuid
  snapshotName: string;
  snapshotResearchPurpose: string;
  snapshotSpecification: SnapshotAccessRequest; // SnapshotBuilderRequest in DataRepo
  createdBy: string;
  status: JobStatus;
}

export interface SnapshotBuilderParentConcept {
  parentId: number;
  children: SnapshotBuilderConcept[];
}

export type SnapshotBuilderCountResponse = {
  result: {
    total: number;
  };
  sql: string;
};

export interface DataRepoContract {
  dataset: (datasetId: string) => {
    details: (include?: DatasetInclude[]) => Promise<DatasetModel>;
    roles: () => Promise<string[]>;
    createSnapshotRequest(request: DatasetAccessRequest): Promise<SnapshotAccessRequestResponse>;
    getSnapshotBuilderCount(request: DatasetParticipantCountRequest): Promise<SnapshotBuilderCountResponse>;
    getConcepts(parent: SnapshotBuilderConcept): Promise<SnapshotBuilderGetConceptsResponse>;
    getConceptHierarchy(concept: SnapshotBuilderConcept): Promise<SnapshotBuilderGetConceptHierarchyResponse>;
    searchConcepts(domain: SnapshotBuilderConcept, text: string): Promise<SnapshotBuilderGetConceptsResponse>;
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

export const DataRepo = (signal?: AbortSignal): DataRepoContract => ({
  dataset: (datasetId) => {
    return {
      details: async (include): Promise<DatasetModel> =>
        callDataRepo(`repository/v1/datasets/${datasetId}?include=${_.join(',', include)}`, signal),
      roles: async (): Promise<string[]> => callDataRepo(`repository/v1/datasets/${datasetId}/roles`, signal),
      createSnapshotRequest: async (request): Promise<SnapshotAccessRequestResponse> =>
        callDataRepoPost(
          `repository/v1/datasets/${datasetId}/snapshotRequests`,
          signal,
          convertDatasetAccessRequest(request)
        ),
      getSnapshotBuilderCount: async (request): Promise<SnapshotBuilderCountResponse> =>
        callDataRepoPost(
          `repository/v1/datasets/${datasetId}/snapshotBuilder/count`,
          signal,
          convertDatasetParticipantCountRequest(request)
        ),
      getConcepts: async (parent: SnapshotBuilderConcept): Promise<SnapshotBuilderGetConceptsResponse> =>
        callDataRepo(`repository/v1/datasets/${datasetId}/snapshotBuilder/concepts/${parent.id}`),
      searchConcepts: async (
        domain: SnapshotBuilderConcept,
        searchText: string
      ): Promise<SnapshotBuilderGetConceptsResponse> => {
        return callDataRepo(
          `repository/v1/datasets/${datasetId}/snapshotBuilder/concepts/${
            domain.id
          }/search?searchText=${encodeURIComponent(searchText)}`
        );
      },
      getConceptHierarchy: async (concept: SnapshotBuilderConcept) =>
        callDataRepo(`repository/v1/datasets/${datasetId}/snapshotBuilder/conceptHierarchy/${concept.id}`),
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
