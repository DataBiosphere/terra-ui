import {
  DomainOption,
  ProgramDataListOption,
  ProgramDataListValueOption,
  ProgramDataRangeOption,
} from 'src/libs/ajax/DatasetBuilder';

/** A specific criteria based on a type. */
export interface Criteria {
  name: string;
  id: number;
  count: number;
}

export interface DomainCriteria extends Criteria {
  domainOption: DomainOption;
}

export interface ProgramDataRangeCriteria extends Criteria {
  rangeOption: ProgramDataRangeOption;
  low: number;
  high: number;
}
export interface ProgramDataListCriteria extends Criteria {
  listOption: ProgramDataListOption;
  value: ProgramDataListValueOption;
}

export type AnyCriteria = DomainCriteria | ProgramDataRangeCriteria | ProgramDataListCriteria;

/** A group of criteria. */
export interface CriteriaGroup {
  name: string;
  criteria: Criteria[];
  mustMeet: boolean;
  meetAll: boolean;
  count: number;
}

let groupCount = 1;
export const newCriteriaGroup = (): CriteriaGroup => {
  return {
    name: `Group ${groupCount++}`,
    criteria: [],
    mustMeet: true,
    meetAll: false,
    count: 0,
  };
};

export interface Cohort extends DatasetBuilderType {
  criteriaGroups: CriteriaGroup[];
}

export const newCohort = (name: string): Cohort => {
  return {
    name,
    criteriaGroups: [],
  };
};

export type ConceptSet = DatasetBuilderType;

export interface DatasetBuilderType {
  name: string;
}

export interface DatasetBuilderState {
  type: 'homepage' | 'cohort-editor' | 'concept-selector' | 'concept-set-creator';
}
