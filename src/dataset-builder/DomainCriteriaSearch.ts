import { h } from 'react-hyperscript-helpers';
import { saveSelected } from 'src/dataset-builder/DomainCriteriaSelector';
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

export const DomainCriteriaSearch = (props: DomainCriteriaSearchProps) => {
  const { state, onStateChange, datasetId, getNextCriteriaIndex } = props;
  return h(ConceptSearch, {
    initialSearch: state.searchText,
    initialCart: state.cart,
    domainOption: state.domainOption,
    onCancel: () => onStateChange(cohortEditorState.new(state.cohort)),
    onCommit: saveSelected(state, getNextCriteriaIndex, onStateChange),
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
