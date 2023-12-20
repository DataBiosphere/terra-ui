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
export interface Criteria {
  count?: number;
}

/** API types represent the data of UI types in the format expected by the backend.
 * They are generally subsets or mappings of the UI types. */

export interface CriteriaApi {
  kind: 'domain' | 'range' | 'list';
  name: string;
  id: number;
}
export interface DomainCriteriaApi extends CriteriaApi {
  kind: 'domain';
}

export interface ProgramDataRangeCriteriaApi extends CriteriaApi {
  kind: 'range';
  low: number;
  high: number;
}

export interface ProgramDataListCriteriaApi extends CriteriaApi {
  kind: 'list';
  values: number[];
}

export type AnyCriteriaApi = DomainCriteriaApi | ProgramDataRangeCriteriaApi | ProgramDataListCriteriaApi;

export interface CriteriaGroupApi {
  name: string;
  criteria: AnyCriteriaApi[];
  mustMeet: boolean;
  meetAll: boolean;
  count: number;
}

export interface CohortApi extends DatasetBuilderType {
  criteriaGroups: CriteriaGroupApi[];
}

export type ValueSetApi = {
  name: string;
  values: string[];
};

export type DatasetRequestApi = {
  cohorts: CohortApi[];
  conceptSets: ConceptSet[];
  valueSets: ValueSetApi[];
};

export type DatasetAccessRequestApi = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: DatasetRequestApi;
};

/** Below are the UI types */

export interface DomainCriteria extends DomainCriteriaApi, Criteria {
  domainOption: DomainOption;
}

export interface ProgramDataRangeCriteria extends ProgramDataRangeCriteriaApi, Criteria {
  rangeOption: ProgramDataRangeOption;
}

export interface ProgramDataListCriteria extends Criteria, CriteriaApi {
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

export type ValueSet = {
  domain: string;
  values: DatasetBuilderValue[];
};

export interface GetConceptsResponse {
  result: Concept[];
}

export type DatasetRequest = {
  cohorts: Cohort[];
  conceptSets: ConceptSet[];
  valueSets: ValueSet[];
};

export type DatasetAccessRequest = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: DatasetRequest;
};

export const convertValueSet = (valueSet: ValueSet): ValueSetApi => {
  return {
    name: valueSet.domain,
    values: _.map('name', valueSet.values),
  };
};

export const convertCohort = (cohort: Cohort): CohortApi => {
  return {
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
  };
};

export const convertCriteria = (criteria: AnyCriteria): AnyCriteriaApi => {
  const mergeObject = { kind: criteria.kind, name: criteria.name, id: criteria.id };
  switch (criteria.kind) {
    case 'range':
      return _.merge(mergeObject, { low: criteria.low, high: criteria.high }) as ProgramDataRangeCriteriaApi;
    case 'list':
      return _.merge(mergeObject, {
        values: _.map((value) => value.id, criteria.values),
      }) as ProgramDataListCriteriaApi;
    case 'domain':
      return mergeObject as DomainCriteriaApi;
    default:
      throw new Error('Criteria not of type range, list, or domain.');
  }
};

export const convertDatasetAccessRequest = (datasetAccessRequest: DatasetAccessRequest) => {
  return {
    name: datasetAccessRequest.name,
    researchPurposeStatement: datasetAccessRequest.researchPurposeStatement,
    datasetRequest: {
      cohorts: _.map(convertCohort, datasetAccessRequest.datasetRequest.cohorts),
      conceptSets: datasetAccessRequest.datasetRequest.conceptSets,
      valueSets: _.map(convertValueSet, datasetAccessRequest.datasetRequest.valueSets),
    },
  };
};

type DatasetParticipantCountRequest = {
  cohorts: Cohort[];
};

export interface DatasetBuilderContract {
  retrieveDataset: (datasetId: string) => Promise<DatasetModel>;
  getConcepts: (datasetId: string, parent: Concept) => Promise<GetConceptsResponse>;
  requestAccess: (datasetId: string, request: DatasetAccessRequest) => Promise<DatasetAccessRequestApi>;
  getParticipantCount: (request: DatasetParticipantCountRequest) => Promise<number>;
}
export const DatasetBuilder = (): DatasetBuilderContract => ({
  retrieveDataset: async (datasetId) => {
    return await Ajax()
      .DataRepo.dataset(datasetId)
      .details([datasetIncludeTypes.SNAPSHOT_BUILDER_SETTINGS, datasetIncludeTypes.PROPERTIES]);
  },
  getConcepts: async (datasetId: string, parent: Concept) => {
    return await Ajax().DataRepo.dataset(datasetId).getConcepts(parent);
  },
  requestAccess: async (datasetId, request) => {
    return await Ajax().DataRepo.dataset(datasetId).createSnapshotRequest(convertDatasetAccessRequest(request));
  },
  getParticipantCount: (_request) => Promise.resolve(100),
});
