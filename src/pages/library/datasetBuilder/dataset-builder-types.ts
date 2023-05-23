// Types that can be used to create a criteria.

type DataType = 'range' | 'list';

export interface ProgramDataType {
  id: number;
  name: string;
  dataType: DataType;
}

export interface ProgramDataRangeType extends ProgramDataType {
  min: number;
  max: number;
}

export interface ProgramDataListTypeValue {
  id: number;
  name: string;
}

export interface ProgramDataListType extends ProgramDataType {
  values: ProgramDataListTypeValue[];
}

export interface DomainType {
  id: number;
  category: string;
  values: string[];
}

/** A specific criteria based on a type. */
export interface Criteria {
  name: string;
  id: number;
  count: number;
}

export interface DomainCriteria extends Criteria {
  category: string;
}

export interface ProgramDataRangeCriteria extends Criteria {
  low: number;
  high: number;
}
export interface ProgramDataListCriteria extends Criteria {
  value: ProgramDataListTypeValue;
}

/** A group of criteria. */
export interface CriteriaGroup {
  criteria: Criteria[];
  mustMeet: boolean;
  meetAll: boolean;
  count: number;
}

export const createCriteriaGroup = (): CriteriaGroup => {
  return {
    criteria: [],
    mustMeet: true,
    meetAll: false,
    count: 0,
  };
};

export interface Cohort extends DatasetBuilderType {
  criteriaGroups: CriteriaGroup[];
}

export type ConceptSet = DatasetBuilderType;

export interface DatasetBuilderType {
  name: string;
}
