import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { DomainCriteria, GetConceptsResponse } from 'src/dataset-builder/DatasetBuilderUtils';
import {
  DataRepo,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderConcept,
  SnapshotBuilderDomainOption as DomainOption,
} from 'src/libs/ajax/DataRepo';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import { useOnMount } from 'src/libs/react-utils';

import { ConceptSelector } from './ConceptSelector';
import {
  AnyDatasetBuilderState,
  cohortEditorState,
  DomainCriteriaSearchState,
  DomainCriteriaSelectorState,
} from './dataset-builder-types';
import { OnStateChangeHandler } from './DatasetBuilder';

interface DomainCriteriaSelectorProps {
  readonly state: DomainCriteriaSelectorState;
  readonly onStateChange: OnStateChangeHandler;
  readonly datasetId: string;
  readonly getNextCriteriaIndex: () => number;
}

export const toCriteria =
  (domainOption: DomainOption, getNextCriteriaIndex: () => number) =>
  (concept: Concept): DomainCriteria => {
    return {
      kind: 'domain',
      conceptId: concept.id,
      name: concept.name,
      id: domainOption.id,
      index: getNextCriteriaIndex(),
      count: concept.count,
      domainOption,
    };
  };

export const saveSelected =
  (
    state: DomainCriteriaSelectorState | DomainCriteriaSearchState,
    getNextCriteriaIndex: () => number,
    onStateChange: (state: AnyDatasetBuilderState) => void
  ) =>
  (selected: SnapshotBuilderConcept[]) => {
    const cartCriteria = _.map(toCriteria(state.domainOption, getNextCriteriaIndex), selected);
    const groupIndex = _.findIndex({ name: state.criteriaGroup.name }, state.cohort.criteriaGroups);
    // add/remove all cart elements to the domain group's criteria list in the cohort
    _.flow(
      _.update(`criteriaGroups.${groupIndex}.criteria`, _.xor(cartCriteria)),
      cohortEditorState.new,
      onStateChange
    )(state.cohort);
  };

export const DomainCriteriaSelector = (props: DomainCriteriaSelectorProps) => {
  const [rootConcepts, loadRootConcepts] = useLoadedData<GetConceptsResponse>();
  const { state, onStateChange, datasetId, getNextCriteriaIndex } = props;
  useOnMount(() => {
    void loadRootConcepts(() => DataRepo().dataset(datasetId).getConcepts(state.domainOption.root));
  });
  return rootConcepts.status === 'Ready'
    ? h(ConceptSelector, {
        initialRows: rootConcepts.state.result,
        title: state.domainOption.category,
        initialCart: state.cart,
        onCancel: () => onStateChange(state.cancelState),
        onCommit: saveSelected(state, getNextCriteriaIndex, onStateChange),
        actionText: 'Add to group',
        datasetId,
      })
    : spinnerOverlay;
};
