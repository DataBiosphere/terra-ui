import * as _ from 'lodash/fp';
import { authOpts, fetchDataRepo } from 'src/libs/ajax/ajax-common';

type TableDataType =
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

type ColumnModel = {
  name: string;
  datatype: TableDataType;
  array_of?: boolean;
  required?: boolean;
};

type DatePartitionOptionsModel = {
  column: string;
};

type IntPartitionOptionsModel = {
  column: string;
  min: number;
  max: number;
  interval: number;
};

type PartitionMode = 'none' | 'date' | 'int';

type TableModel = {
  name: string;
  columns: ColumnModel[];
  primaryKey?: string[];
  partitionMode?: PartitionMode;
  datePartitionOptions?: DatePartitionOptionsModel;
  intPartitionOptions?: IntPartitionOptionsModel;
  rowCount?: number;
};

type RelationshipTermModel = {
  table: string;
  column: string;
};

type RelationshipModel = {
  name: string;
  from: RelationshipTermModel;
  to: RelationshipTermModel;
};

type AssetTableModel = {
  name: string;
  columns: string[];
};

type AssetModel = {
  name: string;
  tables: AssetTableModel[];
  rootTable: string;
  rootColumn: string;
  follow?: string[];
};

type DatasetSpecificationModel = {
  tables: TableModel[];
  relationships?: RelationshipModel[];
  assets?: AssetModel[];
};

type CloudPlatform = 'gcp' | 'azure';

type StorageResourceModel = {
  region?: string;
  cloudResource?: string;
  cloudPlatform?: CloudPlatform;
};

type AccessInfoBigQueryModelTable = {
  name: string;
  id: string;
  qualifiedName: string;
  link?: string;
  sampleQuery: string;
};

type AccessInfoBigQueryModel = {
  datasetName: string;
  datasetId: string;
  projectId: string;
  link: string;
  tables: AccessInfoBigQueryModelTable;
};

type AccessInfoParquetModelTable = {
  name: string;
  url: string;
  sasToken: string;
};

type AccessInfoParquetModel = {
  datasetName: string;
  datasetId: string;
  storageAccountId: string;
  url: string;
  sasToken: string;
  tables: AccessInfoParquetModelTable;
};

type AccessInfoModel = {
  bigQuery?: AccessInfoBigQueryModel;
  parquet?: AccessInfoParquetModel;
};

type ResourceLocks = {
  exclusive: string;
};

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
  defaultProfileId?: string;
  dataProject?: string;
  defaultSnapshotId?: string;
  schema?: DatasetSpecificationModel;
  createdDate: string;
  storage?: StorageResourceModel[];
  secureMonitoringEnabled?: boolean;
  phsId?: string;
  accessInformation?: AccessInfoModel;
  cloudPlatform?: CloudPlatform;
  selfHosted: boolean;
  properties: any;
  ingestServiceAccount?: string;
  predictableFileIds: boolean;
  tags: string[];
  resourceLocks: ResourceLocks;
  snapshotBuilderSettings: SnapshotBuilderSettings;
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
