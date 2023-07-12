import {
  DomainOption,
  ProgramDataListOption,
  ProgramDataListValueOption,
  ProgramDataRangeOption,
} from 'src/libs/ajax/DatasetBuilder';

/** A specific criteria based on a type. */
export interface Criteria {
  kind: 'domain' | 'range' | 'list';
  name: string;
  id: number;
  count: number;
}

export interface DomainCriteria extends Criteria {
  kind: 'domain';
  domainOption: DomainOption;
}

export interface ProgramDataRangeCriteria extends Criteria {
  kind: 'range';
  rangeOption: ProgramDataRangeOption;
  low: number;
  high: number;
}
export interface ProgramDataListCriteria extends Criteria {
  kind: 'list';
  listOption: ProgramDataListOption;
  valuesSelected: ProgramDataListValueOption[];
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

export interface ConceptSet extends DatasetBuilderType {
  featureValueGroupName: string;
}

export interface DatasetBuilderType {
  name: string;
}

type DatasetBuilderMode = 'homepage' | 'cohort-editor' | 'concept-selector' | 'concept-set-creator';

export interface DatasetBuilderState {
  mode: DatasetBuilderMode;
}

export interface HomepageState extends DatasetBuilderState {
  mode: 'homepage';
}

export const homepageState = {
  new: (): HomepageState => ({ mode: 'homepage' }),
};

export interface CohortEditorState extends DatasetBuilderState {
  mode: 'cohort-editor';
  readonly cohort: Cohort;
}

export const cohortEditorState = {
  new: (cohort: Cohort): CohortEditorState => ({ mode: 'cohort-editor', cohort }),
};

export interface ConceptSelectorState extends DatasetBuilderState {
  mode: 'concept-selector';
}

export interface ConceptSetCreatorState extends DatasetBuilderState {
  mode: 'concept-set-creator';
}

export type AnyDatasetBuilderState = HomepageState | CohortEditorState | ConceptSelectorState | ConceptSetCreatorState;
