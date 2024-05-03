import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { div, span } from 'react-hyperscript-helpers';
import {
  AnySnapshotBuilderCriteria,
  DatasetBuilderType,
  SnapshotAccessRequest as SnapshotAccessRequestApi,
  SnapshotBuilderCohort,
  SnapshotBuilderConcept,
  SnapshotBuilderCountRequest,
  SnapshotBuilderDatasetConceptSet,
  SnapshotBuilderDomainCriteria,
  SnapshotBuilderDomainOption,
  SnapshotBuilderFeatureValueGroup,
  SnapshotBuilderOption,
  SnapshotBuilderOptionTypeNames,
  SnapshotBuilderProgramDataListCriteria,
  SnapshotBuilderProgramDataListItem,
  SnapshotBuilderProgramDataListOption,
  SnapshotBuilderProgramDataRangeCriteria,
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
export interface DomainConceptSet extends SnapshotBuilderDatasetConceptSet {
  concept: SnapshotBuilderConcept;
}

export interface ProgramDomainCriteria extends Criteria {
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

export type AnyCriteria = ProgramDomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria;

export type PrepackagedConceptSet = SnapshotBuilderDatasetConceptSet;

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

export type DatasetBuilderValue = DatasetBuilderType;

export type ValueSet = {
  domain: string;
  values: DatasetBuilderValue[];
};

export type SnapshotBuilderRequest = {
  cohorts: Cohort[];
  conceptSets: SnapshotBuilderDatasetConceptSet[];
  valueSets: ValueSet[];
};

export type SnapshotAccessRequest = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: SnapshotBuilderRequest;
};

export const convertValueSet = (valueSet: ValueSet): SnapshotBuilderFeatureValueGroup => {
  return {
    name: valueSet.domain,
    values: _.map('name', valueSet.values),
  };
};

export const convertCohort = (cohort: Cohort): SnapshotBuilderCohort => {
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

export const convertCriteria = (criteria: AnyCriteria): AnySnapshotBuilderCriteria => {
  const { kind, id } = criteria.option;
  const mergeObject = { kind, id };
  switch (criteria.kind) {
    case 'range':
      return _.merge(mergeObject, {
        low: criteria.low,
        high: criteria.high,
      }) as SnapshotBuilderProgramDataRangeCriteria;
    case 'list':
      return _.merge(mergeObject, {
        values: _.map((value) => value.id, criteria.values),
      }) as SnapshotBuilderProgramDataListCriteria;
    case 'domain':
      return _.merge(mergeObject, { conceptId: criteria.conceptId }) as SnapshotBuilderDomainCriteria;
    default:
      throw new Error('Criteria not of type range, list, or domain.');
  }
};

export const createDatasetAccessRequest = (
  name: string,
  researchPurposeStatement: string,
  cohorts: Cohort[],
  conceptSets: SnapshotBuilderDatasetConceptSet[],
  valueSets: ValueSet[]
): SnapshotAccessRequestApi => {
  return {
    name,
    researchPurposeStatement,
    datasetRequest: {
      cohorts: _.map(convertCohort, cohorts),
      conceptSets,
      valueSets: _.map(convertValueSet, valueSets),
    },
  };
};

export const createSnapshotBuilderCountRequest = (cohort: Cohort[]): SnapshotBuilderCountRequest => {
  return { cohorts: _.map(convertCohort, cohort) };
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
