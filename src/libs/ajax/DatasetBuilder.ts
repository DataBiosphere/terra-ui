import _ from 'lodash/fp';
import { DatasetBuilderType } from 'src/pages/library/datasetBuilder/dataset-builder-types';

export interface DatasetResponse {
  name: string;
}

export type DatasetBuilderValue = DatasetBuilderType;

type DatasetBuilderDomainResponse = {
  values: DatasetBuilderValue[];
  domain: string;
};

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetResponse>;
  getValuesFromDomains: (datasetId: string, domains: string[]) => Promise<DatasetBuilderDomainResponse[]>;
}

export const DatasetBuilder = (): DatasetBuilderContract => ({
  retrieveDataset: (datasetId) => Promise.resolve({ name: 'AnalytiXIN', id: datasetId }),
  getValuesFromDomains: (_datasetId, domains) =>
    Promise.resolve(
      _.map((domain) => ({ domain, values: [{ name: 'value 1' }, { name: 'value 2' }, { name: 'value 3' }] }), domains)
    ),
});
