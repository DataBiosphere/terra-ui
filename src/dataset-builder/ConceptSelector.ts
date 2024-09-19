import _ from 'lodash/fp';
import { CSSProperties, Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { LabeledCheckbox, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Parent, RowContents, TreeGrid } from 'src/components/TreeGrid';
import { ConceptCart } from 'src/dataset-builder/ConceptCart';
import { BuilderPageHeaderWrapper } from 'src/dataset-builder/DatasetBuilderHeader';
import { formatCount } from 'src/dataset-builder/DatasetBuilderUtils';
import { DataRepo, SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';

type ConceptSelectorProps = {
  readonly title: string;
  readonly onCancel: (selected: Concept[]) => void;
  readonly onCommit: (selected: Concept[]) => void;
  readonly actionText: string;
  readonly snapshotId: string;
  readonly initialCart: Concept[];
  readonly parents: Parent<Concept>[];
  readonly openedConcept?: Concept;
};

export const tableHeaderStyle: CSSProperties = {
  display: 'flex',
  paddingTop: 15,
  paddingBottom: 15,
  backgroundColor: colors.light(0.4),
  borderRadius: '8px 8px 0px 0px',
  border: `.5px solid ${colors.dark(0.2)}`,
};

// The list of parents is a tree, where each parent has a list of children. Find the root
// of the tree by finding the one parent that is not the child of any other parent.
export const findRoot = <T extends RowContents>(parents: Parent<T>[]) => {
  const childIds = new Set(_.flow(_.map('children'), _.flatten, _.map('id'))(parents));
  const root = _.filter((parent: Parent<T>) => !childIds.has(parent.parentId))(parents);
  return root[0] ? root[0].parentId : 0;
};

export const ConceptSelector = (props: ConceptSelectorProps) => {
  const { title, onCancel, onCommit, actionText, snapshotId, initialCart, parents, openedConcept } = props;

  const [cart, setCart] = useState<Concept[]>(initialCart);
  const getChildren = async (concept: Concept): Promise<Concept[]> =>
    withErrorReporting(`Error getting concept children for concept ${concept.name}`)(async () => {
      const result = await DataRepo().snapshot(snapshotId).getConceptChildren(concept);
      return result.result;
    })();

  return h(Fragment, [
    h(BuilderPageHeaderWrapper, [
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
            name: 'Concept name',
            widthPercentage: 50,
            render: (concept) => {
              return h(Fragment, [
                h(
                  LabeledCheckbox,
                  {
                    style: { marginRight: 12 },
                    checked: _.filter(_.isEqual(concept), cart).length > 0,
                    onChange: () => setCart(_.xorWith(_.isEqual, cart, [concept])),
                  },
                  [
                    div([
                      openedConcept?.id === concept.id
                        ? div({ style: { fontWeight: 600 } }, [concept.name])
                        : concept.name,
                    ]),
                  ]
                ),
              ]);
            },
          },
          { name: 'Concept ID', widthPercentage: 17, render: _.get('id') },
          { name: 'Code', widthPercentage: 17, render: _.get('code') },
          {
            name: '# Participants',
            widthPercentage: 16,
            render: (row) => formatCount(row.count),
          },
        ],
        root: { id: findRoot(parents), name: 'root', code: '0', count: 0, hasChildren: true },
        parents,
        getChildren,
        openedConceptId: openedConcept?.id,
        headerStyle: tableHeaderStyle,
      }),
    ]),
    h(ConceptCart, { actionText, cart, onCommit }),
  ]);
};
