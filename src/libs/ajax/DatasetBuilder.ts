// Types that can be used to create a criteria.

import { getRandomInt } from 'src/pages/workspaces/workspace/analysis/_testData/testData';
import _ from 'lodash/fp';

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

export interface GetConceptsResponse {
  result: Concept[];
}

export interface Concept {
  id: number;
  name: string;
  count: number;
  isLeaf: boolean;
}

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetResponse>;
  getConcepts: (parent?: Concept) => Promise<GetConceptsResponse>;
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

export const generateDummyConcept = (): Concept => ({
  id: getRandomInt(10000),
  name: _.uniqueId('name-'),
  count: getRandomInt(10000),
  isLeaf: false,
});

const generateDummyConcepts = (): GetConceptsResponse => {
  return {
    result: _.times(generateDummyConcept, 3),
  };
};

export const DatasetBuilder = (_signal?: AbortSignal): DatasetBuilderContract => ({
  // TODO: Implement stub code, see DC-722.
  retrieveDataset: (_datasetId) => Promise.resolve(dummyDatasetDetails),
  getConcepts: (_parent?: Concept) => Promise.resolve(generateDummyConcepts()),
});
