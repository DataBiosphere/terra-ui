import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import {
  DomainCriteria,
  GetConceptsHierarchyMapResponse,
  // GetConceptsResponse,
} from 'src/dataset-builder/DatasetBuilderUtils';
import {
  DataRepo,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderDomainOption as DomainOption,
} from 'src/libs/ajax/DataRepo';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import { useOnMount } from 'src/libs/react-utils';

import { ConceptSelector } from './ConceptSelector';
import { cohortEditorState, DomainCriteriaSelectorState } from './dataset-builder-types';
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
      name: concept.name,
      id: concept.id,
      index: getNextCriteriaIndex(),
      count: concept.count,
      domainOption,
    };
  };

// 1. add this piece of state for selectedConcept
// 2. Handling the state.selectedConcept
export const DomainCriteriaSelector = (props: DomainCriteriaSelectorProps) => {
  // const [rootConcepts, loadRootConcepts] = useLoadedData<GetConceptsResponse>();
  const [hierarchyConcepts, loadHierarchyConcepts] = useLoadedData<GetConceptsHierarchyMapResponse>();
  const { state, onStateChange, datasetId, getNextCriteriaIndex } = props;
  useOnMount(() => {
    const selectedConcept = state.selectedConcept;
    if (selectedConcept) {
      void loadHierarchyConcepts(() => DataRepo().dataset(datasetId).getConceptsHierarchy(selectedConcept));
    } else {
      // get me the children of this concept id
      // void loadRootConcepts(() => DataRepo().dataset(datasetId).getConcepts(state.domainOption.root));
    }
  });

  // change InitialRows --> Concept[] || Row<Concept>[]
  // return rootConcepts.status === 'Ready'
  //   ? h(ConceptSelector, {
  //       initialRows: rootConcepts.state.result,
  //       title: state.domainOption.category,
  //       initialCart: state.cart,
  //       onCancel: () => onStateChange(state.cancelState),
  //       onCommit: (selected: Concept[]) => {
  //         const cartCriteria = _.map(toCriteria(state.domainOption, getNextCriteriaIndex), selected);
  //         const groupIndex = _.findIndex({ name: state.criteriaGroup.name }, state.cohort.criteriaGroups);
  //         add/remove all cart elements to the domain group's criteria list in the cohort
  // _.flow(
  //   _.update(`criteriaGroups.${groupIndex}.criteria`, _.xor(cartCriteria)),
  //   cohortEditorState.new,
  //   onStateChange
  // )(state.cohort);
  // },
  // actionText: 'Add to group',
  // datasetId,
  // })
  return hierarchyConcepts.status === 'Ready'
    ? h(ConceptSelector, {
        domainOptionRoot: state.domainOption.root,
        initialRows: hierarchyConcepts.state.result, // call an API instead that will get
        title: state.domainOption.category,
        initialCart: state.cart,
        onCancel: () => onStateChange(state.cancelState),
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
        actionText: 'Add to group',
        datasetId,
      })
    : spinnerOverlay;
};
