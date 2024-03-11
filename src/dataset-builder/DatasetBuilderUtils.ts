import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { div, span } from 'react-hyperscript-helpers';
import {
  ColumnStatisticsIntOrDoubleModel,
  ColumnStatisticsTextModel,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderDomainOption,
  SnapshotBuilderProgramDataOption,
} from 'src/libs/ajax/DataRepo';

/** A specific criteria based on a type. */
export interface Criteria {
  index: number;
  count?: number;
  // The kind is duplicated to make use of the discriminator type
  kind: OptionTypeNames;
  option: Option;
}

/** API types represent the data of UI types in the format expected by the backend.
 * They are generally subsets or mappings of the UI types. */

export interface CriteriaApi {
  // This is the ID for either the domain or the program data option
  id: number;
  kind: OptionTypeNames;
  name: string;
  count?: number;
}

export interface DomainCriteriaApi extends CriteriaApi {
  kind: 'domain';
  // This is the id for the selected concept
  conceptId: number;
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

type OptionTypeNames = 'domain' | 'range' | 'list';

export interface Option {
  id: number;
  name: string;
  kind: OptionTypeNames;
}

export interface ProgramDataRangeOption extends Option {
  kind: 'range';
  min: number;
  max: number;
}

export interface DomainOption extends Option {
  kind: 'domain';
  conceptCount?: number;
  participantCount?: number;
  root: Concept;
}

export interface DomainCriteria extends Criteria {
  kind: 'domain';
  conceptId: number;
  conceptName: string;
  option: DomainOption;
}

export interface ProgramDataRangeCriteria extends Criteria {
  kind: 'range';
  option: ProgramDataRangeOption;
  low: number;
  high: number;
}

export interface ProgramDataListValue {
  id: number;
  name: string;
}

export interface ProgramDataListOption extends Option {
  kind: 'list';
  values: ProgramDataListValue[];
}

export interface ProgramDataListCriteria extends Criteria {
  kind: 'list';
  option: ProgramDataListOption;
  values: ProgramDataListValue[];
}

export type AnyCriteria = DomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria;

/** A group of criteria. */
export interface CriteriaGroup {
  name: string;
  criteria: AnyCriteria[];
  mustMeet: boolean;
  meetAll: boolean;
}

export interface Cohort extends DatasetBuilderType {
  criteriaGroups: CriteriaGroup[];
}

export interface ConceptSet extends DatasetBuilderType {
  concept: Concept;
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

export interface GetConceptHierarchyResponse {
  result: Concept;
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
        criteria: _.map((criteria: AnyCriteria) => convertCriteria(criteria), criteriaGroup.criteria),
      }),
      cohort.criteriaGroups
    ),
  };
};

export const convertCriteria = (criteria: AnyCriteria): AnyCriteriaApi => {
  const { kind, id, name } = criteria.option;
  const mergeObject = { kind, id, name };
  switch (criteria.kind) {
    case 'range':
      return _.merge(mergeObject, { low: criteria.low, high: criteria.high }) as ProgramDataRangeCriteriaApi;
    case 'list':
      return _.merge(mergeObject, {
        values: _.map((value) => value.id, criteria.values),
      }) as ProgramDataListCriteriaApi;
    case 'domain':
      return _.merge(mergeObject, { conceptId: criteria.conceptId }) as DomainCriteriaApi;
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

export type DatasetParticipantCountResponse = {
  result: {
    total: number;
  };
  sql: string;
};

export const convertApiDomainOptionToDomainOption = (domainOption: SnapshotBuilderDomainOption): DomainOption => ({
  ...domainOption,
  name: domainOption.category,
  kind: 'domain',
});

export const convertDatasetParticipantCountRequest = (request: DatasetParticipantCountRequest) => {
  return { cohorts: _.map(convertCohort, request.cohorts) };
};
export const convertProgramDataOptionToListOption = (
  programDataOption: SnapshotBuilderProgramDataOption
): ProgramDataListOption => ({
  id: programDataOption.id,
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
        id: programDataOption.id,
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
    return div([conceptName]);
  }

  const endIndex = startIndex + searchFilter.length;

  return div({ style: { display: 'pre-wrap' } }, [
    span([conceptName.substring(0, startIndex)]),
    span({ style: { fontWeight: 600 } }, [conceptName.substring(startIndex, endIndex)]),
    span([conceptName.substring(endIndex)]),
  ]);
};
