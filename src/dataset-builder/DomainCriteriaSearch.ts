import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { DomainCriteria } from 'src/dataset-builder/DatasetBuilderUtils';
import { SnapshotBuilderConcept as Concept, SnapshotBuilderDomainOption as DomainOption } from 'src/libs/ajax/DataRepo';

import { ConceptSearch } from './ConceptSearch';
import {
  cohortEditorState,
  DomainCriteriaSearchState,
  domainCriteriaSearchState,
  domainCriteriaSelectorState,
} from './dataset-builder-types';
import { OnStateChangeHandler } from './DatasetBuilder';

interface DomainCriteriaSearchProps {
  readonly state: DomainCriteriaSearchState;
  readonly onStateChange: OnStateChangeHandler;
  readonly datasetId: string;
  readonly getNextCriteriaIndex: () => number;
}

export const toCriteria =
  (domainOption: DomainOption, getNextCriteriaIndex: () => number) =>
  (concept: Concept): DomainCriteria => {
    return {
      kind: 'domain',
      name: concept.name,
      id: concept.id,
      index: getNextCriteriaIndex(),
      count: concept.count,
      domainOption,
    };
  };

export const DomainCriteriaSearch = (props: DomainCriteriaSearchProps) => {
  const { state, onStateChange, datasetId, getNextCriteriaIndex } = props;
  return h(ConceptSearch, {
    initialSearch: state.searchText,
    initialCart: state.cart,
    domainOption: state.domainOption,
    onCancel: () => onStateChange(cohortEditorState.new(state.cohort)),
    onCommit: (selected: Concept[]) => {
      const cartCriteria = _.map(toCriteria(state.domainOption, getNextCriteriaIndex), selected);
      const groupIndex = _.findIndex({ name: state.criteriaGroup.name }, state.cohort.criteriaGroups);
      // add/remove all cart elements to the domain group's criteria list in the cohort
      _.flow(
        _.update(`criteriaGroups.${groupIndex}.criteria`, _.xor(cartCriteria)),
        cohortEditorState.new,
        onStateChange
      )(state.cohort);
    },
    onOpenHierarchy: (domainOption: DomainOption, cart: Concept[], searchText: string) => {
      onStateChange(
        domainCriteriaSelectorState.new(
          state.cohort,
          state.criteriaGroup,
          domainOption,
          cart,
          domainCriteriaSearchState.new(state.cohort, state.criteriaGroup, state.domainOption, cart, searchText)
        )
      );
    },
    actionText: 'Add to group',
    datasetId,
  });
};
