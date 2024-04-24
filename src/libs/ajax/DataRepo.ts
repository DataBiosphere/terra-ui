import * as _ from 'lodash/fp';
import {
  convertDatasetAccessRequest,
  convertDatasetParticipantCountRequest,
  DatasetAccessRequest as DatasetAccessRequestUtils,
  DatasetBuilderType,
  DatasetParticipantCountRequest,
  DatasetParticipantCountResponse,
  GetConceptHierarchyResponse,
  GetConceptsResponse,
  SearchConceptsResponse,
} from 'src/dataset-builder/DatasetBuilderUtils';
import { authOpts, fetchDataRepo, jsonBody } from 'src/libs/ajax/ajax-common';

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
  conceptCount?: number;
  participantCount?: number;
  root: SnapshotBuilderConcept;
}

export type SnapshotBuilderFeatureValueGroup = {
  id: number;
  name: string;
  values: string[];
};

export interface DomainConceptSet extends ConceptSet {
  concept: SnapshotBuilderConcept;
}

export type PrepackagedConceptSet = ConceptSet;

export interface ConceptSet extends DatasetBuilderType {
  featureValueGroupName: string;
}

export type SnapshotBuilderSettings = {
  domainOptions: SnapshotBuilderDomainOption[];
  programDataOptions: (SnapshotBuilderProgramDataListOption | SnapshotBuilderProgramDataRangeOption)[];
  featureValueGroups: SnapshotBuilderFeatureValueGroup[];
  datasetConceptSets?: PrepackagedConceptSet[];
};

export interface Criteria {
  // This is the ID for either the domain or the program data option
  id: number;
  kind: SnapshotBuilderOptionTypeNames;
  count?: number;
}

export interface DomainCriteria extends Criteria {
  kind: 'domain';
  // This is the id for the selected concept
  conceptId: number;
}

export interface ProgramDataRangeCriteria extends Criteria {
  kind: 'range';
  low: number;
  high: number;
}

export interface ProgramDataListCriteria extends Criteria {
  kind: 'list';
  values: number[];
}

export type AnyCriteria = DomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria;

export interface CriteriaGroup {
  name: string;
  criteria: AnyCriteria[];
  mustMeet: boolean;
  meetAll: boolean;
}

export interface Cohort extends DatasetBuilderType {
  criteriaGroups: CriteriaGroup[];
}

export type ValueSet = {
  name: string;
  values: string[];
};

export type DatasetRequest = {
  cohorts: Cohort[];
  conceptSets: ConceptSet[];
  valueSets: ValueSet[];
};

export type DatasetAccessRequest = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: DatasetRequest;
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

export interface DataRepoContract {
  dataset: (datasetId: string) => {
    details: (include?: DatasetInclude[]) => Promise<DatasetModel>;
    roles: () => Promise<string[]>;
    createSnapshotRequest(request: DatasetAccessRequestUtils): Promise<DatasetAccessRequest>;
    getCounts(request: DatasetParticipantCountRequest): Promise<DatasetParticipantCountResponse>;
    getConcepts(parent: SnapshotBuilderConcept): Promise<GetConceptsResponse>;
    getConceptHierarchy(concept: SnapshotBuilderConcept): Promise<GetConceptHierarchyResponse>;
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

export const DataRepo = (signal?: AbortSignal): DataRepoContract => ({
  dataset: (datasetId) => {
    return {
      details: async (include): Promise<DatasetModel> =>
        callDataRepo(`repository/v1/datasets/${datasetId}?include=${_.join(',', include)}`, signal),
      roles: async (): Promise<string[]> => callDataRepo(`repository/v1/datasets/${datasetId}/roles`, signal),
      createSnapshotRequest: async (request): Promise<DatasetAccessRequest> =>
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
      searchConcepts: async (domain: SnapshotBuilderConcept, searchText: string): Promise<GetConceptsResponse> => {
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
