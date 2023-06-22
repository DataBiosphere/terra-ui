// Types that can be used to create a criteria.
import { DatasetBuilderType } from 'src/pages/library/datasetBuilder/dataset-builder-types';

export interface DomainOption {
  kind: 'domain';
  id: number;
  category: string;
  conceptCount: number;
  participantCount: number;
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
  id: string;
  description: string;
  programDataOptions: (ProgramDataRangeOption | ProgramDataListOption)[];
  domainOptions: DomainOption[];
  learnMoreLink: string;
  accessLevel: AccessLevel;
  featureValueGroups: FeatureValueGroup[];
}

export type DatasetBuilderValue = DatasetBuilderType;

export type FeatureValueGroup = {
  values: DatasetBuilderValue[];
  name: string;
  id: number;
};

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetResponse>;
}

type AccessLevel = 'Owner' | 'Reader' | 'Discoverer';

export const dummyDatasetDetails = (datasetId: string): DatasetResponse => ({
  name: 'AnalytiXIN',
  id: datasetId,
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
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
    {
      kind: 'domain',
      id: 10,
      category: 'Condition',
      conceptCount: 18000,
      participantCount: 12500,
      values: ['Heart Disease', 'Diabetes', 'Cancer'],
    },
    {
      kind: 'domain',
      id: 11,
      category: 'Procedure',
      conceptCount: 22500,
      participantCount: 11328,
      values: ['Heart Surgery', 'Knee Surgery', 'Cancer Surgery'],
    },
    {
      kind: 'domain',
      id: 12,
      category: 'Observation',
      conceptCount: 12300,
      participantCount: 23223,
      values: ['Blood Pressure', 'Weight', 'Height'],
    },
    {
      kind: 'domain',
      id: 13,
      category: 'Drug',
      conceptCount: 21000,
      participantCount: 12352,
      values: ['Lipitor', 'Metformin', 'Insulin'],
    },
    {
      kind: 'domain',
      id: 14,
      category: 'Labs and measurements',
      conceptCount: 32000,
      participantCount: 25341,
      values: ['Blood Pressure', 'Weight', 'Height'],
    },
  ],
  learnMoreLink: '',
  accessLevel: 'Reader',
  featureValueGroups: [
    {
      values: [{ name: 'condition column 1' }, { name: 'condition column 2' }],
      name: 'Condition',
      id: 0,
    },
    {
      values: [{ name: 'observation column 1' }, { name: 'observation column 2' }],
      name: 'Observation',
      id: 1,
    },
    {
      values: [{ name: 'procedure column 1' }, { name: 'procedure column 2' }],
      name: 'Procedure',
      id: 2,
    },
    {
      values: [{ name: 'surveys column 1' }, { name: 'surveys column 2' }],
      name: 'Surveys',
      id: 2,
    },
    {
      values: [{ name: 'demographics column 1' }, { name: 'demographics column 2' }],
      name: 'Person',
      id: 3,
    },
  ],
});

export const DatasetBuilder = (): DatasetBuilderContract => ({
  retrieveDataset: (datasetId) => Promise.resolve(dummyDatasetDetails(datasetId)),
});
