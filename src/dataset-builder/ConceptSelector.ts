import { IconId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { ActionBar } from 'src/components/ActionBar';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Parent, RowContents, TreeGrid } from 'src/components/TreeGrid';
import { BuilderPageHeader } from 'src/dataset-builder/DatasetBuilderHeader';
import { DataRepo, SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';
import colors from 'src/libs/colors';

type ConceptSelectorProps = {
  readonly title: string;
  readonly onCancel: (selected: Concept[]) => void;
  readonly onCommit: (selected: Concept[]) => void;
  readonly actionText: string;
  readonly datasetId: string;
  readonly initialCart: Concept[];
  readonly parents: Parent<Concept>[];
  readonly openedConcept?: Concept;
};

export const tableHeaderStyle: CSSProperties = {
  height: '100%',
  display: 'flex',
  paddingTop: 15,
  paddingBottom: 15,
  backgroundColor: colors.light(0.4),
  borderRadius: '8px 8px 0px 0px',
  border: `.5px solid ${colors.dark(0.2)}`,
};

// The list of parents is a tree, where each parent has a list of children. Find the root
// of the tree by finding the one parent that is not the child of any other parent
export const findRoot = <T extends RowContents>(parents: Parent<T>[]) => {
  const childIds = new Set(_.flow(_.map('children'), _.flatten, _.map('id'))(parents));
  const root = _.filter((parent: Parent<T>) => !childIds.has(parent.parentId))(parents);
  return root[0] ? root[0].parentId : 0;
};

export const ConceptSelector = (props: ConceptSelectorProps) => {
  const { title, onCancel, onCommit, actionText, datasetId, initialCart, parents, openedConcept } = props;

  const [cart, setCart] = useState<Concept[]>(initialCart);
  const getChildren = async (concept: Concept): Promise<Concept[]> => {
    const result = await DataRepo().dataset(datasetId).getConcepts(concept);
    return result.result;
  };

  return h(Fragment, [
    h(BuilderPageHeader, [
      h2({ style: { display: 'flex', alignItems: 'center' } }, [
        h(
          Link,
          {
            onClick: () => onCancel(cart),
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
                if (_.filter(_.isEqual(concept), cart).length > 0) {
                  return ['remove', 'minus-circle-red'];
                }
                return ['add', 'plus-circle-filled'];
              })();
              return h(Fragment, [
                h(
                  Link,
                  {
                    'aria-label': `${label} ${concept.id}`,
                    onClick: () => setCart(_.xorWith(_.isEqual, cart, [concept])),
                  },
                  [icon(iconName, { size: 16 })]
                ),
                div({ style: { marginLeft: 5 } }, [
                  openedConcept?.id === concept.id ? div({ style: { fontWeight: 600 } }, [concept.name]) : concept.name,
                ]),
              ]);
            },
          },
          { name: 'Concept ID', width: 195, render: _.get('id') },
          { name: 'Roll-up count', width: 205, render: _.get('count') },
        ],
        root: { id: findRoot(parents), name: 'root', count: 0, hasChildren: true },
        parents,
        getChildren,
        headerStyle: tableHeaderStyle,
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
