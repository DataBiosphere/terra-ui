export interface DatasetResponse {
  name: string;
}

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetResponse>;
}

export const DatasetBuilder = (_signal?: AbortSignal): DatasetBuilderContract => ({
  retrieveDataset: (_datasetId) => Promise.resolve({ name: 'AnalytixIndiana' }),
});
