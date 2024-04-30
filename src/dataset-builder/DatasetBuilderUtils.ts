import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { div, span } from 'react-hyperscript-helpers';
import {
  AnyCriteria as AnyCriteriaApi,
  SnapshotAccessRequest as SnapshotAccessRequestApi,
  SnapshotBuilderCohort,
  SnapshotBuilderConcept,
  SnapshotBuilderCountRequest as SnapshotBuilderCountRequestApi,
  SnapshotBuilderDatasetConceptSet,
  SnapshotBuilderDomainCriteria,
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
  option: DomainOption;
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

export type SnapshotAccessRequest = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: DatasetRequest;
};

export interface DomainOption extends SnapshotBuilderOption {
  kind: 'domain';
  root: SnapshotBuilderConcept;
  conceptCount?: number;
  participantCount?: number;
}

export type BuilderSettings = {
  domainOptions: DomainOption[];
  programDataOptions: (SnapshotBuilderProgramDataListOption | SnapshotBuilderProgramDataRangeOption)[];
  featureValueGroups: SnapshotBuilderFeatureValueGroup[];
  datasetConceptSets?: SnapshotBuilderDatasetConceptSet[];
};

export type DatasetModel = {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  properties: any;
  snapshotBuilderSettings?: BuilderSettings;
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

export const convertCriteria = (criteria: AnyCriteria): AnyCriteriaApi => {
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

export const convertDatasetAccessRequest = (datasetAccessRequest: SnapshotAccessRequest): SnapshotAccessRequestApi => {
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

export type SnapshotBuilderCountRequest = {
  cohorts: Cohort[];
};
export const convertDatasetParticipantCountRequest = (
  request: SnapshotBuilderCountRequest
): SnapshotBuilderCountRequestApi => {
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
