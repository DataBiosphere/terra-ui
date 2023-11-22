// Types that can be used to create a criteria.
import _ from 'lodash/fp';
import { Ajax } from 'src/libs/ajax';
import {
  datasetIncludeTypes,
  DatasetModel,
  ProgramDataListOption,
  ProgramDataListValue,
  ProgramDataRangeOption,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderDomainOption as DomainOption,
} from 'src/libs/ajax/DataRepo';

/** A specific criteria based on a type. */
export interface Criteria extends CriteriaApi {
  count?: number;
}
export interface CriteriaApi {
  kind: 'domain' | 'range' | 'list';
  name: string;
  id: number;
}
export interface DomainCriteriaApi extends Criteria {
  kind: 'domain';
}

export interface DomainCriteria extends DomainCriteriaApi {
  domainOption: DomainOption;
}

export interface ProgramDataRangeCriteriaApi extends Criteria {
  kind: 'range';
  low: number;
  high: number;
}

export interface ProgramDataRangeCriteria extends ProgramDataRangeCriteriaApi {
  rangeOption: ProgramDataRangeOption;
}

export interface ProgramDataListCriteria extends Criteria {
  kind: 'list';
  listOption: ProgramDataListOption;
  values: ProgramDataListValue[];
}

export interface ProgramDataListCriteriaApi extends Criteria {
  kind: 'list';
  values: number[];
}

export type AnyCriteria = DomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria;

export type AnyCriteriaApi = DomainCriteriaApi | ProgramDataRangeCriteriaApi | ProgramDataListCriteriaApi;

/** A group of criteria. */
export interface CriteriaGroup {
  name: string;
  criteria: AnyCriteria[];
  mustMeet: boolean;
  meetAll: boolean;
  count: number;
}

export interface CriteriaGroupApi {
  name: string;
  criteria: AnyCriteriaApi[];
  mustMeet: boolean;
  meetAll: boolean;
  count: number;
}

export interface Cohort extends DatasetBuilderType {
  criteriaGroups: CriteriaGroup[];
}

export interface CohortApi extends DatasetBuilderType {
  criteriaGroups: CriteriaGroupApi[];
}

export interface ConceptSet extends DatasetBuilderType {
  featureValueGroupName: string;
}

export interface DatasetBuilderType {
  name: string;
}

export type DatasetBuilderValue = DatasetBuilderType;

type ValueSet = {
  domain: string;
  values: DatasetBuilderValue[];
};

type ValueSetApi = {
  name: string;
  values: string[];
};

export interface GetConceptsResponse {
  result: Concept[];
}

type DatasetRequest = {
  cohorts: Cohort[];
  conceptSets: ConceptSet[];
  valueSets: ValueSet[];
};

export type DatasetRequestApi = {
  cohorts: CohortApi[];
  conceptSets: ConceptSet[];
  valueSets: ValueSetApi[];
};

export type DatasetAccessRequest = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: DatasetRequest;
};

export type DatasetAccessRequestApi = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: DatasetRequestApi;
};

export const convertValueSets = (valueSets: { domain: string; values: DatasetBuilderValue[] }[]) => {
  return _.map(
    (valueSet) => ({ name: valueSet.domain, values: _.map(({ name }) => name, valueSets.values) }),
    valueSets
  );
};

export const convertCohorts = (cohorts: Cohort[]) => {
  return _.map(
    (cohort) => ({
      name: cohort.name,
      criteriaGroups: _.map(
        (criteriaGroup) => ({
          name: criteriaGroup.name,
          mustMeet: criteriaGroup.mustMeet,
          meetAll: criteriaGroup.meetAll,
          count: criteriaGroup.count,
          criteria: _.map((criteria) => convertCriteria(criteria), criteriaGroup.criteria),
        }),
        cohort.criteriaGroups
      ),
    }),
    cohorts
  );
};

export const convertCriteria = (criteria: AnyCriteria) => {
  if (criteria.kind === 'range') {
    return { kind: criteria.kind, name: criteria.name, id: criteria.id, low: criteria.low, high: criteria.high };
  }
  if (criteria.kind === 'list') {
    return {
      kind: criteria.kind,
      name: criteria.name,
      id: criteria.id,
      values: _.map((value) => value.id, criteria.values),
    };
  }
  return { kind: criteria.kind, name: criteria.name, id: criteria.id };
};

export const convertDatasetAccessRequest = (datasetAccessRequest: DatasetAccessRequest) => {
  return {
    name: datasetAccessRequest.name,
    researchPurposeStatement: datasetAccessRequest.researchPurposeStatement,
    datasetRequest: {
      cohorts: convertCohorts(datasetAccessRequest.datasetRequest.cohorts),
      conceptSets: datasetAccessRequest.datasetRequest.conceptSets,
      valueSets: convertValueSets(datasetAccessRequest.datasetRequest.valueSets),
    },
  };
};

type DatasetParticipantCountRequest = {
  cohorts: Cohort[];
};

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetModel>;
  getConcepts: (parent: Concept) => Promise<GetConceptsResponse>;
  requestAccess: (datasetId: string, request: DatasetAccessRequest) => Promise<DatasetAccessRequestApi>;
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

export const getConceptForId = (id: number): Concept => {
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

const getDummyConcepts = async (parent: Concept): Promise<GetConceptsResponse> => {
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
  getConcepts: (parent: Concept) => Promise.resolve(getDummyConcepts(parent)),
  requestAccess: async (datasetId, request) => {
    return await Ajax().DataRepo.dataset(datasetId).createSnapshotRequest(convertDatasetAccessRequest(request));
  },
  getParticipantCount: (_request) => Promise.resolve(100),
});
