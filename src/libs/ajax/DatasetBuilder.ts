import { DomainType, ProgramDataType } from 'src/pages/library/datasetBuilder/dataset-builder-types';

export interface DatasetResponse {
  name: string;
  programDataTypes: ProgramDataType[];
  domainTypes: DomainType[];
}

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetResponse>;
}

export const DatasetBuilder = (_signal?: AbortSignal): DatasetBuilderContract => ({
  retrieveDataset: (_datasetId) =>
    Promise.resolve({
      name: 'AnalytixIndiana',
      programDataTypes: [
        { id: 1, name: 'Year of birth', dataType: 'range', min: 1900, max: 2023 },
        {
          id: 2,
          name: 'Ethnicity',
          dataType: 'list',
          values: ['Hispanic or Latino', 'Not Hispanic or Latino', 'No Matching Concept'],
        },
        { id: 3, name: 'Gender identity', dataType: 'list', values: ['FEMALE', 'MALE', 'No Matching Concept'] },
        {
          id: 4,
          name: 'Race',
          dataType: 'list',
          values: ['American Indian or Alaska Native', 'Asian', 'Black', 'White', 'No Matching Concept'],
        },
      ],
      domainTypes: [
        { id: 10, category: 'Condition', values: ['Heart Disease', 'Diabetes', 'Cancer'] },
        { id: 11, category: 'Procedure', values: ['Heart Surgery', 'Knee Surgery', 'Cancer Surgery'] },
        { id: 12, category: 'Observation', values: ['Blood Pressure', 'Weight', 'Height'] },
        { id: 13, category: 'Drug', values: ['Lipitor', 'Metformin', 'Insulin'] },
        { id: 14, category: 'Labs and measurements', values: ['Blood Pressure', 'Weight', 'Height'] },
      ],
    }),
});
