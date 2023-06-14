// Types that can be used to create a criteria.

export interface DomainOption {
  kind: 'domain';
  id: number;
  category: string;
  values: string[];
}

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

export interface ProgramDataListValueOption {
  id: number;
  name: string;
}

export interface ProgramDataListOption extends ProgramDataOption {
  kind: 'list';
  values: ProgramDataListValueOption[];
}

export interface DatasetResponse {
  name: string;
  programDataOptions: (ProgramDataRangeOption | ProgramDataListOption)[];
  domainOptions: DomainOption[];
}

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetResponse>;
}

export const dummyDatasetDetails: DatasetResponse = {
  name: 'AnalytixIndiana',
  programDataOptions: [
    { id: 1, name: 'Year of birth', kind: 'range', min: 1900, max: 2023 },
    {
      id: 2,
      name: 'Ethnicity',
      kind: 'list',
      values: [
        { name: 'Hispanic or Latino', id: 20 },
        { name: 'Not Hispanic or Latino', id: 21 },
        { name: 'No Matching Concept', id: 0 },
      ],
    },
    {
      id: 3,
      name: 'Gender identity',
      kind: 'list',
      values: [
        { name: 'FEMALE', id: 22 },
        { name: 'MALE', id: 23 },
        { name: 'No Matching Concept', id: 0 },
      ],
    },
    {
      id: 4,
      name: 'Race',
      kind: 'list',
      values: [
        { name: 'American Indian or Alaska Native', id: 24 },
        { name: 'Asian', id: 25 },
        { name: 'Black', id: 26 },
        { name: 'White', id: 27 },
        { name: 'No Matching Concept', id: 0 },
      ],
    },
  ],
  domainOptions: [
    { kind: 'domain', id: 10, category: 'Condition', values: ['Heart Disease', 'Diabetes', 'Cancer'] },
    { kind: 'domain', id: 11, category: 'Procedure', values: ['Heart Surgery', 'Knee Surgery', 'Cancer Surgery'] },
    { kind: 'domain', id: 12, category: 'Observation', values: ['Blood Pressure', 'Weight', 'Height'] },
    { kind: 'domain', id: 13, category: 'Drug', values: ['Lipitor', 'Metformin', 'Insulin'] },
    { kind: 'domain', id: 14, category: 'Labs and measurements', values: ['Blood Pressure', 'Weight', 'Height'] },
  ],
};

export const DatasetBuilder = (_signal?: AbortSignal): DatasetBuilderContract => ({
  // TODO: Implement stub code, see DC-722.
  retrieveDataset: (_datasetId) => Promise.resolve(dummyDatasetDetails),
});
