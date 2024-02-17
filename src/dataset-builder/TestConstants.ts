import _ from 'lodash/fp';
import {
  DatasetModel,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderConceptNode as ConceptNode,
} from 'src/libs/ajax/DataRepo';

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
  { id: 400, name: 'Carcinoma of lung parenchyma', count: 100, hasChildren: true },
  { id: 401, name: 'Squamous cell carcinoma of lung', count: 100, hasChildren: true },
  { id: 402, name: 'Non-small cell lung cancer', count: 100, hasChildren: true },
  { id: 403, name: 'Epidermal growth factor receptor negative ...', count: 100, hasChildren: false },
  { id: 404, name: 'Non-small cell lung cancer with mutation in epidermal..', count: 100, hasChildren: true },
  { id: 405, name: 'Non-small cell cancer of lung biopsy..', count: 100, hasChildren: false },
  { id: 406, name: 'Non-small cell cancer of lung lymph node..', count: 100, hasChildren: false },
  { id: 407, name: 'Small cell lung cancer', count: 100, hasChildren: true },
  { id: 408, name: 'Lung Parenchcyma', count: 100, hasChildren: false },
];

export const dummyGetConceptForId = (id: number): Concept => {
  return _.find({ id }, dummyConcepts)!;
};

export const dummyHierarchy = [
  {
    id: 406,
    concept: dummyGetConceptForId(406),
    children: [],
    parent: 404,
  },
  {
    id: 405,
    concept: dummyGetConceptForId(405),
    children: [],
    parent: 404,
  },
  {
    id: 404,
    concept: dummyGetConceptForId(404),
    children: [405, 406],
    parent: 401,
  },
  {
    id: 403,
    concept: dummyGetConceptForId(403),
    children: [],
    parent: 401,
  },
  {
    id: 407,
    concept: dummyGetConceptForId(407),
    children: [],
    parent: 402,
  },
  {
    id: 402,
    concept: dummyGetConceptForId(402),
    children: [407],
    parent: 401,
  },
  {
    id: 401,
    concept: dummyGetConceptForId(401),
    children: [402, 403, 404],
    parent: 400,
  },
  {
    id: 400,
    concept: dummyGetConceptForId(400),
    children: [401],
    parent: 100,
  },
  {
    id: 408,
    concept: dummyGetConceptForId(408),
    children: [],
    parent: 100,
  },
  {
    id: 100,
    concept: dummyGetConceptForId(100),
    children: [400, 408],
  },
];

export const dummyGetNodeFromHierarchy = (id: number): ConceptNode => {
  return _.find({ id }, dummyHierarchy)!;
};

export const getHierarchyMap = (openedConceptID: number): Map<Concept, Concept[]> => {
  const hierarchyMap = new Map<Concept, Concept[]>();
  const populateHierarchyMap = (node: ConceptNode) => {
    if (node.concept.hasChildren) {
      const children = node.children;
      const childrenObjects = _.map((childID) => dummyGetConceptForId(childID), children);
      hierarchyMap.set(node.concept, childrenObjects);
    }
    if (node.parent) {
      populateHierarchyMap(dummyGetNodeFromHierarchy(node.parent));
    }
  };

  // get the openedConceptNode
  const openedConceptNode = dummyGetNodeFromHierarchy(openedConceptID);

  // if the opened concept does not have a node in a hierarchy
  if (!openedConceptNode) {
    return hierarchyMap;
  }

  // if the openedConceptNode has a parent, we want to populate the hierarchy of its parent
  if (openedConceptNode.parent) {
    const selectedConceptParent = dummyGetNodeFromHierarchy(openedConceptNode.parent);
    populateHierarchyMap(selectedConceptParent);
  } else {
    // we chose the domain root concept
    hierarchyMap.set(openedConceptNode.concept, []);
  }
  return new Map<Concept, Concept[]>(Array.from(hierarchyMap.entries()).reverse());
};
