import { IconId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { ActionBar } from 'src/components/ActionBar';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TreeGrid } from 'src/components/TreeGrid';
import { BuilderPageHeader } from 'src/dataset-builder/DatasetBuilderHeader';
import { DataRepo, SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';
import colors from 'src/libs/colors';

type ConceptSelectorProps = {
  readonly title: string;
  readonly onCancel: () => void;
  readonly onCommit: (selected: Concept[]) => void;
  readonly actionText: string;
  readonly datasetId: string;
  readonly initialCart: Concept[];
  readonly domainOptionRoot: Concept;
  readonly initialHierarchy: Map<number, Concept[]>;
  readonly selectedConceptName?: string;
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

export const ConceptSelector = (props: ConceptSelectorProps) => {
  const {
    title,
    onCancel,
    onCommit,
    actionText,
    datasetId,
    initialCart,
    domainOptionRoot,
    initialHierarchy,
    selectedConceptName,
  } = props;
};

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
                h(Link, { 'aria-label': `${label} ${concept.id}`, onClick: () => setCart(_.xor(cart, [concept])) }, [
                  icon(iconName, { size: 16 }),
                ]),
                div({ style: { marginLeft: 5 } }, [
                  selectedConceptName === concept.name
                    ? div({ style: { fontWeight: 600, whiteSpace: 'pre' } }, [concept.name])
                    : concept.name,
                ]),
              ]);
            },
          },
          { name: 'Concept ID', width: 195, render: _.get('id') },
          { name: 'Roll-up count', width: 205, render: _.get('count') },
        ],
        initialHierarchy,
        domainOptionRoot,
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
