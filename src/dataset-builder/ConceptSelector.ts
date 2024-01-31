import { IconId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { ActionBar } from 'src/components/ActionBar';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TreeGrid } from 'src/components/TreeGrid';
import { DataRepo, SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';

import { PAGE_PADDING_HEIGHT, PAGE_PADDING_WIDTH } from './constants';

type ConceptSelectorProps = {
  readonly initialRows: Map<Concept, Concept[]>;
  readonly domainOptionRoot: Concept;
  readonly title: string;
  readonly onCancel: () => void;
  readonly onCommit: (selected: Concept[]) => void;
  readonly actionText: string;
  readonly datasetId: string;
  readonly initialCart: Concept[];
};

export const ConceptSelector = (props: ConceptSelectorProps) => {
  const { initialRows, domainOptionRoot, title, onCancel, onCommit, actionText, datasetId, initialCart } = props;
  const [cart, setCart] = useState<Concept[]>(initialCart);
  const getChildren = async (concept: Concept): Promise<Concept[]> => {
    const result = await DataRepo().dataset(datasetId).getConcepts(concept);
    return result.result;
  };

  return h(Fragment, [
    div({ style: { padding: `${PAGE_PADDING_HEIGHT}rem ${PAGE_PADDING_WIDTH}rem` } }, [
      h2({ style: { display: 'flex', alignItems: 'center' } }, [
        h(
          Link,
          {
            onClick: onCancel,
            'aria-label': 'cancel',
          },
          [icon('left-circle-filled', { size: 32 })]
        ),
        div({ style: { marginLeft: 15 } }, [title]),
      ]),
      h(TreeGrid<Concept>, {
        columns: [
          {
            name: 'Concept Name',
            width: 710,
            render: (concept) => {
              const [label, iconName]: [string, IconId] = (() => {
                if (_.contains(concept, cart)) {
                  return ['remove', 'minus-circle-red'];
                }
                return ['add', 'plus-circle-filled'];
              })();
              return h(Fragment, [
                h(Link, { 'aria-label': label, onClick: () => setCart(_.xor(cart, [concept])) }, [
                  icon(iconName, { size: 16 }),
                ]),
                div({ style: { marginLeft: 5 } }, [concept.name]),
              ]);
            },
          },
          { name: 'Concept ID', width: 195, render: _.get('id') },
          { name: 'Roll-up count', width: 205, render: _.get('count') },
        ],
        initialRows,
        domainOptionRoot,
        // pass in a different set of initialRows
        getChildren,
      }),
    ]),
    cart.length !== 0 &&
      h(ActionBar, {
        prompt: cart.length === 1 ? '1 concept selected' : `${cart.length} concepts selected`,
        actionText,
        onClick: () => _.flow(onCommit)(cart),
      }),
  ]);
};
