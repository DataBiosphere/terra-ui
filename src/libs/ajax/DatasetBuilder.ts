export interface DatasetResponse {
  name: string;
}

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetResponse>;
}

export const DatasetBuilder = (signal?: AbortSignal): DatasetBuilderContract => ({
  retrieveDataset: (datasetId) => Promise.resolve({ name: 'AnalytixIndiana' }),
});
