import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { div, span } from 'react-hyperscript-helpers';
import { HeaderAndValues } from 'src/dataset-builder/DatasetBuilder';
import {
  AnySnapshotBuilderCriteria,
  DatasetBuilderType,
  SnapshotAccessRequest as SnapshotAccessRequestApi,
  SnapshotBuilderCohort,
  SnapshotBuilderCountRequest,
  SnapshotBuilderDomainCriteria,
  SnapshotBuilderDomainOption,
  SnapshotBuilderOption,
  SnapshotBuilderOptionTypeNames,
  SnapshotBuilderOutputTableApi,
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

/** A group of criteria. */
export interface CriteriaGroup {
  id: number;
  criteria: AnyCriteria[];
  mustMeet: boolean;
  meetAll: boolean;
}

export interface Cohort extends DatasetBuilderType {
  criteriaGroups: CriteriaGroup[];
}

export type DatasetBuilderValue = DatasetBuilderType;

export type OutputTable = {
  domain: string;
  columns: DatasetBuilderValue[];
};

export type SnapshotBuilderRequest = {
  cohorts: Cohort[];
  outputTables: OutputTable[];
};

export type SnapshotAccessRequest = {
  name: string;
  researchPurposeStatement: string;
  datasetRequest: SnapshotBuilderRequest;
};

export const convertOutputTable = (outputTable: OutputTable): SnapshotBuilderOutputTableApi => {
  return {
    name: outputTable.domain,
    columns: _.map('name', outputTable.columns),
  };
};

export const convertCohort = (cohort: Cohort): SnapshotBuilderCohort => {
  return {
    name: cohort.name,
    criteriaGroups: _.map(
      (criteriaGroup) => ({
        mustMeet: criteriaGroup.mustMeet,
        meetAll: criteriaGroup.meetAll,
        criteria: _.map((criteria: AnyCriteria) => convertCriteria(criteria), criteriaGroup.criteria),
      }),
      cohort.criteriaGroups
    ),
  };
};

export const convertCriteria = (criteria: AnyCriteria): AnySnapshotBuilderCriteria => {
  // We need to provide a default in case option isn't a field on bogus criteria
  const { kind, id } = criteria.option || { kind: undefined };
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

export const createSnapshotAccessRequest = (
  name: string,
  researchPurposeStatement: string,
  snapshotId: string,
  cohorts: Cohort[],
  valueSets: OutputTable[]
): SnapshotAccessRequestApi => {
  return {
    name,
    sourceSnapshotId: snapshotId,
    researchPurposeStatement,
    snapshotBuilderRequest: {
      cohorts: _.map(convertCohort, cohorts),
      outputTables: _.map(convertOutputTable, valueSets),
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

export const addCohortToSelectedCohorts = (
  cohort: Cohort,
  cohortGroupName: string,
  selectedCohorts: HeaderAndValues<Cohort>[],
  setSelectedCohorts: (cohorts: HeaderAndValues<Cohort>[]) => void
) => {
  const index = _.findIndex(
    (selectedCohort: HeaderAndValues<Cohort>) => selectedCohort.header === cohortGroupName,
    selectedCohorts
  );
  setSelectedCohorts(
    index === -1
      ? selectedCohorts.concat({
          header: cohortGroupName,
          values: [cohort],
        })
      : _.set(`[${index}].values`, _.xorWith(_.isEqual, selectedCohorts[index].values, [cohort]), selectedCohorts)
  );
};
