import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { span, strong } from 'react-hyperscript-helpers';
import {
  ColumnStatisticsIntOrDoubleModel,
  ColumnStatisticsTextModel,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderDomainOption as DomainOption,
  SnapshotBuilderProgramDataOption,
} from 'src/libs/ajax/DataRepo';

/** A specific criteria based on a type. */
export interface Criteria {
  index: number;
  count?: number;
  loading?: boolean;
}

/** API types represent the data of UI types in the format expected by the backend.
 * They are generally subsets or mappings of the UI types. */

export interface CriteriaApi {
  kind: 'domain' | 'range' | 'list';
  name: string;
  count?: number;
}

export interface DomainCriteriaApi extends CriteriaApi {
  kind: 'domain';
  id: number;
}

export interface ProgramDataOption {
  kind: 'range' | 'list';
}

export interface ProgramDataRangeOption extends ProgramDataOption {
  kind: 'range';
  name: string;
  min: number;
  max: number;
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

export interface ProgramDataListValue {
  id: number;
  name: string;
}

export interface ProgramDataListOption extends ProgramDataOption {
  kind: 'list';
  name: string;
  values: ProgramDataListValue[];
}

export interface ProgramDataListCriteria extends Criteria, CriteriaApi {
  kind: 'list';
  listOption: ProgramDataListOption;
  values: ProgramDataListValue[];
}

export type AnyCriteria = DomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria;

export type LoadingAnyCriteria = AnyCriteria | { loading: true; index: number };

/** A group of criteria. */
export interface CriteriaGroup {
  name: string;
  criteria: LoadingAnyCriteria[];
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

export interface SearchConceptsResponse {
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
        criteria: _.flow(
          _.filter((criteria: LoadingAnyCriteria) => !criteria.loading),
          _.map((criteria: AnyCriteria) => convertCriteria(criteria))
        )(criteriaGroup.criteria),
      }),
      cohort.criteriaGroups
    ),
  };
};

export const convertCriteria = (criteria: AnyCriteria): AnyCriteriaApi => {
  const mergeObject = { kind: criteria.kind, name: criteria.name };
  switch (criteria.kind) {
    case 'range':
      return _.merge(mergeObject, { low: criteria.low, high: criteria.high }) as ProgramDataRangeCriteriaApi;
    case 'list':
      return _.merge(mergeObject, {
        values: _.map((value) => value.id, criteria.values),
      }) as ProgramDataListCriteriaApi;
    case 'domain':
      return _.merge(mergeObject, { id: criteria.id }) as DomainCriteriaApi;
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

export type DatasetParticipantCountRequest = {
  cohorts: Cohort[];
};

export type DatasetParticipantCountRequestApi = {
  cohorts: CohortApi[];
};
export type DatasetParticipantCountResponse = {
  result: {
    total: number;
  };
  sql: string;
};

export const convertDatasetParticipantCountRequest = (request: DatasetParticipantCountRequest) => {
  return { cohorts: _.map(convertCohort, request.cohorts) };
};
export const convertProgramDataOptionToListOption = (
  programDataOption: SnapshotBuilderProgramDataOption
): ProgramDataListOption => ({
  name: programDataOption.name,
  kind: 'list',
  values: _.map(
    (num) => ({
      id: num,
      name: `${programDataOption.name} ${num}`,
    }),
    [0, 1, 2, 3, 4]
  ),
});

export const convertProgramDataOptionToRangeOption = (
  programDataOption: SnapshotBuilderProgramDataOption,
  statistics: ColumnStatisticsIntOrDoubleModel | ColumnStatisticsTextModel
): ProgramDataRangeOption => {
  switch (statistics.dataType) {
    case 'float':
    case 'float64':
    case 'integer':
    case 'int64':
    case 'numeric':
      return {
        name: programDataOption.name,
        kind: 'range',
        min: statistics.minValue,
        max: statistics.maxValue,
      };
    default:
      throw new Error(
        `Datatype ${statistics.dataType} for ${programDataOption.tableName}/${programDataOption.columnName} is not numeric`
      );
  }
};

export const HighlightConceptName = ({ conceptName, searchFilter }): ReactElement => {
  const startIndex = conceptName.toLowerCase().indexOf(searchFilter.toLowerCase());

  // searchFilter is empty or does not exist in conceptName
  if (startIndex < 0 || searchFilter.trim() === '') {
    return span([conceptName]);
  }

  const endIndex = startIndex + searchFilter.length;

  return span([
    span([conceptName.substring(0, startIndex)]),
    strong([conceptName.substring(startIndex, endIndex)]),
    span([conceptName.substring(endIndex)]),
  ]);
};
