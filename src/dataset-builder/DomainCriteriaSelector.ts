import _ from 'lodash/fp';
import { useEffect, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import {
  DomainCriteria,
  GetConceptsHierarchyMapResponse,
  GetConceptsResponse,
} from 'src/dataset-builder/DatasetBuilderUtils';
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
  const [hierarchyConcepts, loadHierarchyConcepts] = useLoadedData<GetConceptsHierarchyMapResponse>();
  const { state, onStateChange, datasetId, getNextCriteriaIndex } = props;
  const [hierarchy, setHierarchy] = useState(new Map<number, Concept[]>());
  const [isHierarchyLoaded, setIsHierarchyLoaded] = useState(false);
  useOnMount(() => {
    const openedConcept = state.openedConcept;
    if (openedConcept) {
      void loadHierarchyConcepts(() => DataRepo().dataset(datasetId).getConceptsHierarchy(openedConcept));
    } else {
      // get the children of this concept
      void loadRootConcepts(() => DataRepo().dataset(datasetId).getConcepts(state.domainOption.root));
    }
  });

  useEffect(() => {
    if (rootConcepts.status === 'Ready') {
      setHierarchy(new Map<number, Concept[]>([[state.domainOption.root.id, rootConcepts.state.result]]));
      setIsHierarchyLoaded(true);
    } else if (hierarchyConcepts.status === 'Ready') {
      setHierarchy(hierarchyConcepts.state.result);
      setIsHierarchyLoaded(true);
    }
  }, [rootConcepts, hierarchyConcepts, state.domainOption]);

  return isHierarchyLoaded
    ? h(ConceptSelector, {
        initialHierarchy: hierarchy,
        domainOptionRoot: state.domainOption.root,
        title: state.domainOption.category,
        initialCart: state.cart,
        onCancel: (cart: Concept[]) =>
          onStateChange(
            state.cancelState.mode === 'domain-criteria-search' ? { ...state.cancelState, cart } : state.cancelState
          ),
        onCommit: saveSelected(state, getNextCriteriaIndex, onStateChange),
        actionText: 'Add to group',
        datasetId,
        openedConceptName: state.openedConcept?.name,
      })
    : spinnerOverlay;
};
