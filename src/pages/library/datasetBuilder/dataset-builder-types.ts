export interface Criteria {
  name: string;
  id: number;
  count: number;
}

export interface DomainCriteria extends Criteria {
  category: string;
}

type DataType = 'range' | 'list';

export interface ProgramDataType {
  id: number;
  dataType: DataType;
}

export interface ProgramDataRangeType extends ProgramDataType {
  min: number;
  max: number;
}

export interface ProgramDataListType extends ProgramDataType {
  values: string[];
}

export interface ProgramDataRangeCriteria extends Criteria {
  low: number;
  high: number;
}
export interface ProgramDataListCriteria extends Criteria {
  valueId: number;
  value: string;
}

export interface CriteriaGroup {
  criteria: Criteria[];
  mustMeet: boolean;
  meetAll: boolean;
}
export interface Cohort extends DatasetBuilderType {
  criteriaGroups: CriteriaGroup[];
}

export type ConceptSet = DatasetBuilderType;

export interface DatasetBuilderType {
  name: string;
}
