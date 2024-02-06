import _ from 'lodash/fp';
import { DomainCriteria } from 'src/dataset-builder/DatasetBuilderUtils';
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
    domainOptionRoot: state.domainOption.root,
    onOpenHierarchy: (
      domainOption: DomainOption,
      cart: Concept[],
      searchText: string,
      selectedConcept: Concept = domainOption.root
    ) => {

    initialCart: state.cart,
    domainOption: state.domainOption,
    onCancel: () => onStateChange(cohortEditorState.new(state.cohort)),
    onCommit: saveSelected(state, getNextCriteriaIndex, onStateChange),
      onStateChange(
        domainCriteriaSelectorState.new(
          state.cohort,
          state.criteriaGroup,
          domainOption,
          cart,
          domainCriteriaSearchState.new(state.cohort, state.criteriaGroup, state.domainOption, cart, searchText),
          selectedConcept
        )
      );
    },
    actionText: 'Add to group',
    datasetId,
  });
};
