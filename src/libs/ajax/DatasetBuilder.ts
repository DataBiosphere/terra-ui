export interface DatasetResponse {
  name: string;
}

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetResponse>;
}

export const DatasetBuilder = (): DatasetBuilderContract => ({
  retrieveDataset: (datasetId) => Promise.resolve({ name: 'AnalytiXIN', id: datasetId }),
});
