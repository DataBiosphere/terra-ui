import _ from 'lodash/fp';
import {
  DatasetModel,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderConceptNode as ConceptNode,
} from 'src/libs/ajax/DataRepo';
// import { RowContents } from "src/components/TreeGrid";

export const dummyDatasetModel = (): DatasetModel => ({
  name: 'AnalytiXIN',
  id: '0',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. Ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  createdDate: new Date().toDateString(),
  properties: {},
  snapshotBuilderSettings: {
    programDataOptions: [
      { name: 'Year of birth', kind: 'range', tableName: 'person', columnName: 'year_of_birth' },
      {
        name: 'Ethnicity',
        kind: 'list',
        tableName: 'person',
        columnName: 'ethnicity',
      },
      {
        name: 'Gender identity',
        kind: 'list',
        tableName: 'person',
        columnName: 'gender_identity',
      },
      {
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
  // { id: 101, name: 'Clinical Finding', count: 100, hasChildren: true },
  // { id: 102, name: 'Disease', count: 100, hasChildren: true },
  // { id: 103, name: 'Disorder by body site', count: 100, hasChildren: false },
  // { id: 104, name: 'Inflammatory disorder', count: 100, hasChildren: false },
  // { id: 105, name: 'Degenerative disorder', count: 100, hasChildren: false },
  // { id: 106, name: 'Metabolic disease', count: 100, hasChildren: false },
  // { id: 107, name: 'Finding by site', count: 100, hasChildren: false },
  // { id: 108, name: 'Neurological finding', count: 100, hasChildren: false },
  //
  // { id: 200, name: 'Procedure', count: 100, hasChildren: true },
  // { id: 201, name: 'Procedure', count: 100, hasChildren: true },
  // { id: 202, name: 'Surgery', count: 100, hasChildren: false },
  // { id: 203, name: 'Heart Surgery', count: 100, hasChildren: false },
  // { id: 204, name: 'Cancer Surgery', count: 100, hasChildren: false },
  //
  // { id: 300, name: 'Observation', count: 100, hasChildren: true },
  // { id: 301, name: 'Blood Pressure', count: 100, hasChildren: false },
  // { id: 302, name: 'Weight', count: 100, hasChildren: false },
  // { id: 303, name: 'Height', count: 100, hasChildren: false },
  //
  { id: 400, name: 'Carcinoma of lung parenchyma', count: 100, hasChildren: true },
  { id: 401, name: 'Squamous cell carcinoma of lung', count: 100, hasChildren: true },
  { id: 402, name: 'Non-small cell lung cancer', count: 100, hasChildren: false },
  { id: 403, name: 'Epidermal growth factor receptor negative ...', count: 100, hasChildren: false },
  { id: 404, name: 'Non-small cell lung cancer with mutation in epidermal..', count: 100, hasChildren: true },
  { id: 405, name: 'Non-small cell cancer of lung biopsy..', count: 100, hasChildren: false },
];

export const dummyGetConceptForId = (id: number): Concept => {
  return _.find({ id }, dummyConcepts)!;
};

export const dummyHierarchy = [
  {
    id: 405,
    concept: dummyGetConceptForId(405),
    children: [],
    parent: 404,
  },
  {
    id: 404,
    concept: dummyGetConceptForId(404),
    children: [405],
    parent: 401,
  },
  {
    id: 403,
    concept: dummyGetConceptForId(403),
    children: [],
    parent: 401,
  },
  {
    id: 402,
    concept: dummyGetConceptForId(402),
    children: [],
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
    id: 100,
    concept: dummyGetConceptForId(100),
    children: [400],
  },
];

export const dummyGetNodeFromHierarchy = (id: number): ConceptNode => {
  return _.find({ id }, dummyHierarchy)!;
};

export const dummyGetParentInHierarchy = (id: number): ConceptNode => {
  const node = dummyGetNodeFromHierarchy(id);
  if (node.parent) {
    return dummyGetParentInHierarchy(node.parent);
  }
  return node;
};

export const getHierarchyMap = (id: number): Map<Concept, Concept[]> => {
  const parentNode = dummyGetParentInHierarchy(id);
  const hierarchyMap = new Map<Concept, Concept[]>();

  const populateHierarchyMap = (node: ConceptNode) => {
    if (node.concept.hasChildren) {
      const children = node.children;
      const childrenObjects = _.map((childID) => dummyGetConceptForId(childID), children);
      hierarchyMap.set(node.concept, childrenObjects);
      children.forEach((childID) => {
        const childNode = dummyGetNodeFromHierarchy(childID);
        populateHierarchyMap(childNode);
      });
    }
  };
  populateHierarchyMap(parentNode);
  return hierarchyMap;
};

export const getRenderArray = (hierarchyMap: Map<Concept, Concept[]>): Concept[] => {
  const tree: {
    name: string;
    id: number;
    hasChildren: boolean;
    children: Concept[];
  }[] = [];

  hierarchyMap.forEach((value: Concept[], key: Concept) => {
    tree.push({
      name: key.name,
      id: key.id,
      hasChildren: key.hasChildren,
      children: value,
    });
  });
  return tree;
};

// make this into populated and ready for use in DomainCriteriaSelector
