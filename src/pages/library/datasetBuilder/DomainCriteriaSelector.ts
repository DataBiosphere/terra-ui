import _ from 'lodash/fp';
import React, { Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TreeGridView } from 'src/components/TreeGrid';
import { Concept, DatasetBuilder, generateDummyConcept } from 'src/libs/ajax/DatasetBuilder';
import { cohortEditorState, DomainCriteriaSelectorState } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { OnStateChangeHandler } from 'src/pages/library/datasetBuilder/DatasetBuilder';

const getChildren = async (concept: Concept): Promise<Concept[]> => {
  const result = await DatasetBuilder().getConcepts(concept);
  return result.result;
};

interface DomainSelectorProps {
  state: DomainCriteriaSelectorState;
  onStateChange: OnStateChangeHandler;
}

export const DomainCriteriaSelector: React.FC<DomainSelectorProps> = (props) => {
  const { state, onStateChange } = props;
  const [cart, setCart] = useState<number[]>([]);
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
    h(TreeGridView<Concept>, {
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
      initialRows: [generateDummyConcept()],
      getChildren,
    }),
    div({ style: { display: 'float' } }, [
      cart.length === 1 ? '1 concept selected' : `${cart.length} concepts selected`,
      h(
        ButtonPrimary,
        {
          onClick: () => {
            _.flow(cohortEditorState.new, onStateChange)(state.cohort);
          },
        },
        ['Add to group']
      ),
    ]),
  ]);
};
