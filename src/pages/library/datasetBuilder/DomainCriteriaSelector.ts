import _ from 'lodash/fp';
import React, { Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TreeGridView } from 'src/components/TreeGrid';
import {
  Concept,
  DatasetBuilder,
  DomainOption,
  getConceptForId,
  GetConceptsResponse,
} from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import { useOnMount } from 'src/libs/react-utils';
import {
  cohortEditorState,
  DomainCriteria,
  DomainCriteriaSelectorState,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { OnStateChangeHandler } from 'src/pages/library/datasetBuilder/DatasetBuilder';

const getChildren = async (concept: Concept): Promise<Concept[]> => {
  const result = await DatasetBuilder().getConcepts(concept);
  return result.result;
};

interface DomainSelectorProps {
  state: DomainCriteriaSelectorState;
  onStateChange: OnStateChangeHandler;
}

const conceptToCriteria =
  (domainOption: DomainOption) =>
  (concept: Concept): DomainCriteria => {
    return {
      kind: 'domain',
      name: concept.name,
      id: concept.id,
      count: concept.count,
      domainOption,
    };
  };

export const DomainCriteriaSelector: React.FC<DomainSelectorProps> = (props) => {
  const [rootConcepts, loadRootConcepts] = useLoadedData<GetConceptsResponse>();
  const { state, onStateChange } = props;
  const [cart, setCart] = useState<number[]>([]);

  useOnMount(() => {
    void loadRootConcepts(() => DatasetBuilder().getConcepts(state.domainOption.root));
  });
  return h(Fragment, [
    h2({ style: { display: 'flex', alignItems: 'center' } }, [
      h(
        Link,
        {
          onClick: () => {
            onStateChange(cohortEditorState.new(state.cohort));
          },
          'aria-label': 'cancel',
        },
        [icon('left-circle-filled', { size: 32 })]
      ),
      div({ style: { marginLeft: 15 } }, [state.domainOption.category]),
    ]),
    rootConcepts.status === 'Ready'
      ? h(TreeGridView<Concept>, {
          columns: [
            {
              name: 'Concept name',
              width: 710,
              render: (concept) =>
                h(Fragment, [
                  h(Link, { onClick: () => setCart(_.xor(cart, [concept.id])) }, [
                    icon(_.contains(concept.id, cart) ? 'minus-circle-red' : 'plus-circle-filled', { size: 16 }),
                  ]),
                  div({ style: { marginLeft: 5 } }, [concept.name]),
                ]),
            },
            { name: 'Concept ID', width: 195, render: _.get('id') },
            { name: 'Roll-up count', width: 205, render: _.get('count') },
          ],
          initialRows: rootConcepts.state.result,
          getChildren,
        })
      : spinnerOverlay,
    cart.length !== 0 &&
      div({ style: { display: 'float' } }, [
        cart.length === 1 ? '1 concept selected' : `${cart.length} concepts selected`,
        h(
          ButtonPrimary,
          {
            onClick: () => {
              const cartCriteria = _.map(_.flow(getConceptForId, conceptToCriteria(state.domainOption)), cart);
              const groupIndex = _.findIndex({ name: state.criteriaGroup.name }, state.cohort.criteriaGroups);
              // add/remove all cart elements to the domain group's criteria list in the cohort
              _.flow(
                _.update(`criteriaGroups.${groupIndex}.criteria`, _.xor(cartCriteria)),
                cohortEditorState.new,
                onStateChange
              )(state.cohort);
            },
          },
          ['Add to group']
        ),
      ]),
  ]);
};
