import { Cohort, CriteriaGroup } from 'src/dataset-builder/DatasetBuilderUtils';
import { SnapshotBuilderConcept as Concept, SnapshotBuilderDomainOption as DomainOption } from 'src/libs/ajax/DataRepo';

let groupCount = 1;
export const newCriteriaGroup = (): CriteriaGroup => {
  return {
    name: `Group ${groupCount++}`,
    criteria: [],
    mustMeet: true,
    meetAll: false,
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
  | 'domain-criteria-selector'
  | 'domain-criteria-search';

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
  readonly cart: Concept[];
  readonly cancelState: AnyDatasetBuilderState;
  readonly openedConcept?: Concept;
}

export const domainCriteriaSelectorState = {
  new: (
    cohort: Cohort,
    criteriaGroup: CriteriaGroup,
    domainOption: DomainOption,
    cart: Concept[],
    cancelState: AnyDatasetBuilderState,
    openedConcept?: Concept
  ): DomainCriteriaSelectorState => ({
    mode: 'domain-criteria-selector',
    cohort,
    criteriaGroup,
    domainOption,
    cart,
    cancelState,
    openedConcept,
  }),
};

export interface DomainCriteriaSearchState extends DatasetBuilderState {
  mode: 'domain-criteria-search';

  readonly cohort: Cohort;
  readonly criteriaGroup: CriteriaGroup;
  readonly domainOption: DomainOption;
  readonly cart: Concept[];
  readonly searchText: string;
}

export const domainCriteriaSearchState = {
  new: (
    cohort: Cohort,
    criteriaGroup: CriteriaGroup,
    domainOption: DomainOption,
    cart: Concept[] = [],
    searchText = ''
  ): DomainCriteriaSearchState => ({
    mode: 'domain-criteria-search',
    cohort,
    criteriaGroup,
    domainOption,
    cart,
    searchText,
  }),
};

export interface ConceptSetCreatorState extends DatasetBuilderState {
  mode: 'concept-set-creator';
}

export type AnyDatasetBuilderState =
  | HomepageState
  | CohortEditorState
  | ConceptSetCreatorState
  | DomainCriteriaSelectorState
  | DomainCriteriaSearchState;

export type Updater<T> = (updater: (value: T) => T) => void;
