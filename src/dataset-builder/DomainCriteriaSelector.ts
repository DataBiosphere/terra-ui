import { useLoadedData } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { Parent } from 'src/components/TreeGrid';
import { ProgramDomainCriteria } from 'src/dataset-builder/DatasetBuilderUtils';
import {
  DataRepo,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderConcept,
  SnapshotBuilderDomainOption,
} from 'src/libs/ajax/DataRepo';
import { withErrorReporting } from 'src/libs/error';
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
  readonly snapshotId: string;
  readonly getNextCriteriaIndex: () => number;
}

export const toCriteria =
  (domainOption: SnapshotBuilderDomainOption, getNextCriteriaIndex: () => number) =>
  (concept: Concept): ProgramDomainCriteria => {
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
    const groupIndex = _.findIndex({ id: state.criteriaGroup.id }, state.cohort.criteriaGroups);
    // add/remove all cart elements to the domain group's criteria list in the cohort
    _.flow(
      _.update(`criteriaGroups.${groupIndex}.criteria`, _.xor(cartCriteria)),
      cohortEditorState.new,
      onStateChange
    )(state.cohort);
  };

export const DomainCriteriaSelector = (props: DomainCriteriaSelectorProps) => {
  const { state, onStateChange, snapshotId, getNextCriteriaIndex } = props;
  const [hierarchy, setHierarchy] = useLoadedData<Parent<Concept>[]>();
  useOnMount(() => {
    const openedConcept = state.openedConcept;
    if (openedConcept) {
      void setHierarchy(
        withErrorReporting(`Error loading hierarchy information for ${openedConcept.name}`)(async () => {
          return (await DataRepo().snapshot(snapshotId).getConceptHierarchy(openedConcept)).result;
        })
      );
    } else {
      // get the children of this concept
      void setHierarchy(async () => {
        const results = (
          await withErrorReporting(`Error getting concept children for ${state.domainOption.root.name}`)(
            async () => await DataRepo().snapshot(snapshotId).getConceptChildren(state.domainOption.root)
          )()
        ).result;
        return [{ parentId: state.domainOption.root.id, children: results }];
      });
    }
  });

  return hierarchy.status === 'Ready'
    ? h(ConceptSelector, {
        parents: hierarchy.state,
        domainOptionRoot: state.domainOption.root,
        title: state.domainOption.name,
        initialCart: state.cart,
        onCancel: (cart: Concept[]) =>
          onStateChange(
            state.cancelState.mode === 'domain-criteria-search' ? { ...state.cancelState, cart } : state.cancelState
          ),
        onCommit: saveSelected(state, getNextCriteriaIndex, onStateChange),
        actionText: 'Add to group',
        snapshotId,
        openedConcept: state.openedConcept,
      })
    : spinnerOverlay;
};
