import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TreeGridView } from 'src/components/TreeGrid';
import { Concept, DatasetBuilder, DatasetResponse, getConceptForId } from 'src/libs/ajax/DatasetBuilder';
import { PAGE_PADDING_HEIGHT, PAGE_PADDING_WIDTH } from 'src/pages/library/datasetBuilder/constants';
import { homepageState } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { ActionBar, OnStateChangeHandler } from 'src/pages/library/datasetBuilder/DatasetBuilder';
import { datasetBuilderConceptSets } from 'src/pages/library/datasetBuilder/state';

const getChildren = async (concept: Concept): Promise<Concept[]> => {
  const result = await DatasetBuilder().getConcepts(concept);
  return result.result;
};

export type ConceptSetCreatorProps = {
  readonly onStateChange: OnStateChangeHandler;
  readonly datasetDetails: DatasetResponse;
};

export const ConceptSetCreator = (props: ConceptSetCreatorProps) => {
  const { onStateChange, datasetDetails } = props;
  const [cart, setCart] = useState<number[]>([]);
  return h(Fragment, [
    div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem` } }, [
      h2({ style: { display: 'flex', alignItems: 'center' } }, [
        h(
          Link,
          {
            onClick: () => {
              onStateChange(homepageState.new());
            },
            'aria-label': 'cancel',
          },
          [icon('left-circle-filled', { size: 32 })]
        ),
        div({ style: { marginLeft: 15 } }, ['Add concept']),
      ]),
      h(TreeGridView<Concept>, {
        columns: [
          {
            name: 'Concept Name',
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
        initialRows: _.map(_.get('root'), datasetDetails.domainOptions),
        getChildren,
      }),
    ]),
    cart.length !== 0 &&
      h(ActionBar, {
        prompt: cart.length === 1 ? '1 concept selected' : `${cart.length} concepts selected`,
        actionText: 'Add to concept sets',
        onClick: () => {
          _.flow(_.map(getConceptForId), _.union(datasetBuilderConceptSets.get()), datasetBuilderConceptSets.set)(cart);
          onStateChange(homepageState.new());
        },
      }),
  ]);
};
