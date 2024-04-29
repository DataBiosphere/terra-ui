import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { div, span } from 'react-hyperscript-helpers';
import {
  DomainCriteria as DomainCriteriaApi,
  ProgramDataListCriteria as ProgramDataListCriteriaApi,
  ProgramDataRangeCriteria as ProgramDataRangeCriteriaApi,
  SnapshotBuilderCohort as CohortApi,
  SnapshotBuilderCriteria as AnyCriteriaApi,
  SnapshotBuilderDatasetConceptSet,
  SnapshotBuilderDomainOption,
  SnapshotBuilderFeatureValueGroup as ValueSetApi,
  SnapshotBuilderOption,
  SnapshotBuilderOptionTypeNames,
  SnapshotBuilderProgramDataListItem,
  SnapshotBuilderProgramDataListOption,
  SnapshotBuilderProgramDataRangeOption,
} from 'src/libs/ajax/DataRepo';

/** A specific criteria based on a type. */
export interface Criteria {
  index: number;
  count?: number;
  // The kind is duplicated to make use of the discriminator type
  kind: SnapshotBuilderOptionTypeNames;
  option: SnapshotBuilderOption;
}

/** Below are the UI types */
export interface DomainCriteria extends Criteria {
  kind: 'domain';
  conceptId: number;
  conceptName: string;
  option: SnapshotBuilderDomainOption;
}

export interface ProgramDataRangeCriteria extends Criteria {
  kind: 'range';
  option: SnapshotBuilderProgramDataRangeOption;
  low: number;
  high: number;
}

export interface ProgramDataListCriteria extends Criteria {
  kind: 'list';
  option: SnapshotBuilderProgramDataListOption;
  values: SnapshotBuilderProgramDataListItem[];
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

export interface DatasetBuilderType {
  name: string;
}

export type DatasetBuilderValue = DatasetBuilderType;

export type ValueSet = {
  domain: string;
  values: DatasetBuilderValue[];
};

export type DatasetRequest = {
  cohorts: Cohort[];
  conceptSets: SnapshotBuilderDatasetConceptSet[];
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
  const { kind, id } = criteria.option;
  const mergeObject = { kind, id };
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

export const convertDatasetParticipantCountRequest = (request: DatasetParticipantCountRequest) => {
  return { cohorts: _.map(convertCohort, request.cohorts) };
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

export const formatCount = (count: number): string => {
  return count === 19 ? 'Less than 20' : count.toString();
};
