// Types that can be used to create a criteria.

export interface DomainOption {
  id: number;
  category: string;
  values: string[];
}

type DataType = 'range' | 'list';

export interface ProgramDataOption {
  dataType: DataType;
  id: number;
  name: string;
}

export interface ProgramDataRangeOption extends ProgramDataOption {
  dataType: 'range';
  min: number;
  max: number;
}

export interface ProgramDataListValueOption {
  id: number;
  name: string;
}

export interface ProgramDataListOption extends ProgramDataOption {
  dataType: 'list';
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
    { id: 1, name: 'Year of birth', dataType: 'range', min: 1900, max: 2023 },
    {
      id: 2,
      name: 'Ethnicity',
      dataType: 'list',
      values: [
        { name: 'Hispanic or Latino', id: 20 },
        { name: 'Not Hispanic or Latino', id: 21 },
        { name: 'No Matching Concept', id: 0 },
      ],
    },
    {
      id: 3,
      name: 'Gender identity',
      dataType: 'list',
      values: [
        { name: 'FEMALE', id: 22 },
        { name: 'MALE', id: 23 },
        { name: 'No Matching Concept', id: 0 },
      ],
    },
    {
      id: 4,
      name: 'Race',
      dataType: 'list',
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
    { id: 10, category: 'Condition', values: ['Heart Disease', 'Diabetes', 'Cancer'] },
    { id: 11, category: 'Procedure', values: ['Heart Surgery', 'Knee Surgery', 'Cancer Surgery'] },
    { id: 12, category: 'Observation', values: ['Blood Pressure', 'Weight', 'Height'] },
    { id: 13, category: 'Drug', values: ['Lipitor', 'Metformin', 'Insulin'] },
    { id: 14, category: 'Labs and measurements', values: ['Blood Pressure', 'Weight', 'Height'] },
  ],
};

export const DatasetBuilder = (_signal?: AbortSignal): DatasetBuilderContract => ({
  // TODO: Implement stub code, see DC-722.
  retrieveDataset: (_datasetId) => Promise.resolve(dummyDatasetDetails),
});
