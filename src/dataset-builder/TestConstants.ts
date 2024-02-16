import _ from 'lodash/fp';
import { DatasetModel, SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';

export const dummyDatasetModel = (): DatasetModel => ({
  name: 'AnalytiXIN',
  id: '0',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  createdDate: new Date().toDateString(),
  properties: {},
  snapshotBuilderSettings: {
    programDataOptions: [
      {
        id: 0,
        name: 'Year of birth',
        kind: 'range',
        tableName: 'person',
        columnName: 'year_of_birth',
      },
      {
        id: 1,
        name: 'Ethnicity',
        kind: 'list',
        tableName: 'person',
        columnName: 'ethnicity',
      },
      {
        id: 2,
        name: 'Gender identity',
        kind: 'list',
        tableName: 'person',
        columnName: 'gender_identity',
      },
      {
        id: 3,
        name: 'Race',
        kind: 'list',
        tableName: 'person',
        columnName: 'race',
      },
    ],
    domainOptions: [
      {
        id: 10,
        category: 'Condition',
        conceptCount: 18000,
        participantCount: 12500,
        root: dummyGetConceptForId(100),
      },
      {
        id: 11,
        category: 'Procedure',
        conceptCount: 22500,
        participantCount: 11328,
        root: dummyGetConceptForId(200),
      },
      {
        id: 12,
        category: 'Observation',
        conceptCount: 12300,
        participantCount: 23223,
        root: dummyGetConceptForId(300),
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

export const dummyConcepts = [
  // IDs must be unique.
  { id: 100, name: 'Condition', count: 100, hasChildren: true },
  { id: 101, name: 'Clinical Finding', count: 100, hasChildren: true },
  { id: 102, name: 'Disease', count: 100, hasChildren: true },
  { id: 103, name: 'Disorder by body site', count: 100, hasChildren: false },
  { id: 104, name: 'Inflammatory disorder', count: 100, hasChildren: false },
  { id: 105, name: 'Degenerative disorder', count: 100, hasChildren: false },
  { id: 106, name: 'Metabolic disease', count: 100, hasChildren: false },
  { id: 107, name: 'Finding by site', count: 100, hasChildren: false },
  { id: 108, name: 'Neurological finding', count: 100, hasChildren: false },

  { id: 200, name: 'Procedure', count: 100, hasChildren: true },
  { id: 201, name: 'Procedure', count: 100, hasChildren: true },
  { id: 202, name: 'Surgery', count: 100, hasChildren: false },
  { id: 203, name: 'Heart Surgery', count: 100, hasChildren: false },
  { id: 204, name: 'Cancer Surgery', count: 100, hasChildren: false },

  { id: 300, name: 'Observation', count: 100, hasChildren: true },
  { id: 301, name: 'Blood Pressure', count: 100, hasChildren: false },
  { id: 302, name: 'Weight', count: 100, hasChildren: false },
  { id: 303, name: 'Height', count: 100, hasChildren: false },
];

export const dummyGetConceptForId = (id: number): Concept => {
  return _.find({ id }, dummyConcepts)!;
};
