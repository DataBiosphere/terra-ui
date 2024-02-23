import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { DomainCriteria, DomainOption } from 'src/dataset-builder/DatasetBuilderUtils';
import { DataRepo, SnapshotBuilderConcept as Concept, SnapshotBuilderConcept } from 'src/libs/ajax/DataRepo';
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
      conceptName: concept.name,
      index: getNextCriteriaIndex(),
      count: concept.count,
      option: domainOption,
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
  const { state, onStateChange, datasetId, getNextCriteriaIndex } = props;
  const [hierarchy, setHierarchy] = useLoadedData<Map<Concept, Concept[]>>();
  useOnMount(() => {
    const openedConcept = state.openedConcept;
    if (openedConcept) {
      void setHierarchy(async () => {
        return (await DataRepo().dataset(datasetId).getConceptsHierarchy(openedConcept)).result;
      });
    } else {
      // get the children of this concept
      void setHierarchy(async () => {
        const results = (await DataRepo().dataset(datasetId).getConcepts(state.domainOption.root)).result;
        return new Map<Concept, Concept[]>([[state.domainOption.root, results]]);
      });
    }
  });

  return hierarchy.status === 'Ready'
    ? h(ConceptSelector, {
        initialHierarchy: hierarchy.state,
        domainOptionRoot: state.domainOption.root,
        title: state.domainOption.name,
        initialCart: state.cart,
        onCancel: (cart: Concept[]) =>
          onStateChange(
            state.cancelState.mode === 'domain-criteria-search' ? { ...state.cancelState, cart } : state.cancelState
          ),
        onCommit: saveSelected(state, getNextCriteriaIndex, onStateChange),
        actionText: 'Add to group',
        datasetId,
        openedConcept: state.openedConcept,
      })
    : spinnerOverlay;
};
