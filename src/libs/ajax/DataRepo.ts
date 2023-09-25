import * as _ from 'lodash/fp';
import { authOpts, fetchDataRepo } from 'src/libs/ajax/ajax-common';

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

type SnapshotDetails = {};

type JobModel = {};

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

export interface DataRepoContract {
  dataset: (datasetId: string) => {
    details: (include?: DatasetInclude[]) => Promise<DatasetModel>;
    roles: () => Promise<string[]>;
  };
  snapshot: (snapshotId: string) => {
    details: () => Promise<SnapshotDetails>;
    exportSnapshot: () => Promise<JobModel>;
  };
  job: (jobId: string) => {
    details: () => Promise<JobModel>;
    result: () => Promise<{}>;
  };
}

export const DataRepo = (signal?: AbortSignal): DataRepoContract => ({
  dataset: (datasetId) => ({
    details: async (include): Promise<DatasetModel> => {
      const res = await fetchDataRepo(
        `repository/v1/datasets/${datasetId}?include=${_.join(',', include)}`,
        _.merge(authOpts(), { signal })
      );
      return await res.json();
    },
    roles: async (): Promise<string[]> => {
      const res = await fetchDataRepo(`repository/v1/datasets/${datasetId}/roles`, _.merge(authOpts(), { signal }));
      return res.json();
    },
  }),
  snapshot: (snapshotId) => {
    return {
      details: async () => {
        const res = await fetchDataRepo(`repository/v1/snapshots/${snapshotId}`, _.merge(authOpts(), { signal }));
        return res.json();
      },
      exportSnapshot: async () => {
        const res = await fetchDataRepo(
          `repository/v1/snapshots/${snapshotId}/export?validatePrimaryKeyUniqueness=false`,
          _.merge(authOpts(), { signal })
        );
        return res.json();
      },
    };
  },
  job: (jobId) => ({
    details: async () => {
      const res = await fetchDataRepo(`repository/v1/jobs/${jobId}`, _.merge(authOpts(), { signal }));
      return res.json();
    },
    result: async () => {
      const res = await fetchDataRepo(`repository/v1/jobs/${jobId}/result`, _.merge(authOpts(), { signal }));
      return res.json();
    },
  }),
});
