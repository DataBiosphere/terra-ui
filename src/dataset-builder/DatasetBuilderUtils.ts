import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
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

type HighlightSearchTextProps = {
  readonly columnItem: string;
  readonly searchFilter: string;
  readonly style?: {};
};

export const HighlightSearchText = (props: HighlightSearchTextProps): ReactElement => {
  const { columnItem, searchFilter, style } = props;
  const startIndex = columnItem.toLowerCase().indexOf(searchFilter.toLowerCase());

  // searchFilter is empty or does not exist in columnItem
  if (startIndex < 0 || searchFilter.trim() === '') {
    return div({ style: { ...style } }, [columnItem]);
  }

  const endIndex = startIndex + searchFilter.length;

  return div({ style: { ...style } }, [
    span([columnItem.substring(0, startIndex)]),
    span({ style: { fontWeight: 600 } }, [columnItem.substring(startIndex, endIndex)]),
    span([
      h(HighlightSearchText, {
        columnItem: columnItem.substring(endIndex),
        searchFilter,
        style: { display: 'inline' },
      }),
    ]),
  ]);
};

export const formatCount = (count: number): string => {
  return count === 19 ? 'Less than 20' : count.toString();
};

export const addSelectableObjectToGroup = <T extends DatasetBuilderType>(
  selectableObject: T,
  header: string,
  group: HeaderAndValues<T>[],
  setGroup: (groups: HeaderAndValues<T>[]) => void
) => {
  const index = _.findIndex((selectedObject: HeaderAndValues<T>) => selectedObject.header === header, group);
  setGroup(
    index === -1
      ? group.concat({
          header,
          values: [selectableObject],
        })
      : _.set(`[${index}].values`, _.xorWith(_.isEqual, group[index].values, [selectableObject]), group)
  );
};

// Debounce next calls until result's promise resolve
// Code from stackoverflow answer: https://stackoverflow.com/questions/74800112/debounce-async-function-and-ensure-sequentiality
export const debounceAsync = <T>(fn: (...args: any[]) => T) => {
  let activePromise: Promise<T> | undefined;
  let cancel: () => void | undefined;
  const debouncedFn = (...args: any) => {
    cancel?.();
    if (activePromise) {
      const abortController = new AbortController();
      cancel = abortController.abort.bind(abortController);
      activePromise.then(() => {
        if (abortController.signal.aborted) {
          return;
        }
        debouncedFn(...args);
      });
      return;
    }

    activePromise = Promise.resolve(fn(...args));
    activePromise.finally(() => {
      activePromise = undefined;
    });
  };
  return debouncedFn;
};
