import { Cohort, CriteriaGroup, DomainOption } from 'src/libs/ajax/DatasetBuilder';

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

export const newCohort = (name: string): Cohort => {
  return {
    name,
    criteriaGroups: [],
  };
};

type DatasetBuilderMode =
  | 'homepage'
  | 'cohort-editor'
  | 'concept-selector'
  | 'concept-set-creator'
  | 'domain-criteria-selector';

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

export interface DomainCriteriaSelectorState extends DatasetBuilderState {
  mode: 'domain-criteria-selector';

  readonly cohort: Cohort;
  readonly criteriaGroup: CriteriaGroup;
  readonly domainOption: DomainOption;
}

export const domainCriteriaSelectorState = {
  new: (cohort: Cohort, criteriaGroup: CriteriaGroup, domainOption: DomainOption): DomainCriteriaSelectorState => ({
    mode: 'domain-criteria-selector',
    cohort,
    criteriaGroup,
    domainOption,
  }),
};

export interface ConceptSetCreatorState extends DatasetBuilderState {
  mode: 'concept-set-creator';
}

export type AnyDatasetBuilderState =
  | HomepageState
  | CohortEditorState
  | ConceptSetCreatorState
  | DomainCriteriaSelectorState;
