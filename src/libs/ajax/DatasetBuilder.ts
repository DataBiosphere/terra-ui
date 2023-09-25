// Types that can be used to create a criteria.
import _ from 'lodash/fp';
import { Ajax } from 'src/libs/ajax';
import {
  datasetIncludeTypes,
  DatasetModel,
  ProgramDataListOption,
  ProgramDataListValue,
  ProgramDataRangeOption,
  SnapshotBuilderConcept,
  SnapshotBuilderDomainOption,
} from 'src/libs/ajax/DataRepo';

/** A specific criteria based on a type. */
export interface Criteria {
  kind: 'domain' | 'range' | 'list';
  name: string;
  id: number;
  count?: number;
}

export interface DomainCriteria extends Criteria {
  kind: 'domain';
  domainOption: SnapshotBuilderDomainOption;
}

export interface ProgramDataRangeCriteria extends Criteria {
  kind: 'range';
  rangeOption: ProgramDataRangeOption;
  low: number;
  high: number;
}

export interface ProgramDataListCriteria extends Criteria {
  kind: 'list';
  listOption: ProgramDataListOption;
  values: ProgramDataListValue[];
}

export type AnyCriteria = DomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria;

/** A group of criteria. */
export interface CriteriaGroup {
  name: string;
  criteria: AnyCriteria[];
  mustMeet: boolean;
  meetAll: boolean;
  count: number;
}

export interface Cohort extends DatasetBuilderType {
  criteriaGroups: CriteriaGroup[];
}

export interface ConceptSet extends DatasetBuilderType {
  featureValueGroupName: string;
}

export interface DatasetBuilderType {
  name: string;
}

export type DatasetBuilderValue = DatasetBuilderType;

export interface GetConceptsResponse {
  result: SnapshotBuilderConcept[];
}

type DatasetRequest = {
  cohorts: Cohort[];
  conceptSets: ConceptSet[];
  valuesSets: { domain: string; values: DatasetBuilderValue[] }[];
};

type DatasetAccessRequest = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: DatasetRequest;
};

type DatasetParticipantCountRequest = {
  cohorts: Cohort[];
};

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetModel>;
  getConcepts: (parent: SnapshotBuilderConcept) => Promise<GetConceptsResponse>;
  requestAccess: (request: DatasetAccessRequest) => Promise<void>;
  getParticipantCount: (request: DatasetParticipantCountRequest) => Promise<number>;
}

const dummyConcepts = [
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

export const getConceptForId = (id: number): SnapshotBuilderConcept => {
  return _.find({ id }, dummyConcepts)!;
};

const dummyConceptToParent = [
  // the parent of 101 is 100, etc
  [101, 100],
  [102, 101],
  [103, 102],
  [104, 102],
  [105, 102],
  [106, 102],
  [107, 101],
  [108, 101],
  [201, 200],
  [202, 201],
  [203, 201],
  [204, 201],
  [301, 300],
  [302, 300],
  [303, 300],
];

const getDummyConcepts = async (parent: SnapshotBuilderConcept): Promise<GetConceptsResponse> => {
  // Use a 1s delay to simulate server response time.
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    result: _.flow(
      _.filter(([_childId, parentId]) => parent.id === parentId),
      _.map(_.head),
      _.map(getConceptForId)
    )(dummyConceptToParent),
  };
};

export const DatasetBuilder = (): DatasetBuilderContract => ({
  retrieveDataset: async (datasetId) => {
    return await Ajax()
      .DataRepo.dataset(datasetId)
      .details([datasetIncludeTypes.SNAPSHOT_BUILDER_SETTINGS, datasetIncludeTypes.PROPERTIES]);
  },
  getConcepts: (parent: SnapshotBuilderConcept) => Promise.resolve(getDummyConcepts(parent)),
  requestAccess: (_request) => Promise.resolve(),
  getParticipantCount: (_request) => Promise.resolve(100),
});
