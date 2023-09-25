import { DatasetModel } from 'src/libs/ajax/DataRepo';
import { getConceptForId } from 'src/libs/ajax/DatasetBuilder';

export const dummyDatasetDetails = (datasetId: string): DatasetModel => ({
  name: 'AnalytiXIN',
  id: datasetId,
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  createdDate: new Date().toDateString(),
  selfHosted: false,
  properties: {},
  predictableFileIds: false,
  tags: [],
  resourceLocks: { exclusive: '' },
  snapshotBuilderSettings: {
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
        id: 10,
        category: 'Condition',
        conceptCount: 18000,
        participantCount: 12500,
        root: getConceptForId(100),
      },
      {
        id: 11,
        category: 'Procedure',
        conceptCount: 22500,
        participantCount: 11328,
        root: getConceptForId(200),
      },
      {
        id: 12,
        category: 'Observation',
        conceptCount: 12300,
        participantCount: 23223,
        root: getConceptForId(300),
      },
    ],
    featureValueGroups: [
      {
        values: ['condition column 1', 'condition column 2'],
        name: 'Condition',
        id: 0,
      },
      {
        values: ['observation column 1', 'observation column 2'],
        name: 'Observation',
        id: 1,
      },
      {
        values: ['procedure column 1', 'procedure column 2'],
        name: 'Procedure',
        id: 2,
      },
      {
        values: ['surveys column 1', 'surveys column 2'],
        name: 'Surveys',
        id: 2,
      },
      {
        values: ['demographics column 1', 'demographics column 2'],
        name: 'Person',
        id: 3,
      },
    ],
    datasetConceptSets: [
      { name: 'Demographics', featureValueGroupName: 'Person' },
      { name: 'All surveys', featureValueGroupName: 'Surveys' },
    ],
  },
});
