import _ from 'lodash/fp';
import { CSSProperties, Fragment, useState } from 'react';
import { div, h, h2, strong } from 'react-hyperscript-helpers';
import { ActionBar } from 'src/components/ActionBar';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { BuilderPageHeader } from 'src/dataset-builder/DatasetBuilderHeader';
import { StyledSimpleTable } from 'src/dataset-builder/StyledSimpleTable';
import { SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';
import colors from 'src/libs/colors';

type ConceptSelectorProps = {
  readonly title: string;
  readonly onCancel: (selected: Concept[]) => void;
  readonly onCommit: (selected: Concept[]) => void;
  readonly actionText: string;
  readonly initialCart: Concept[];
  readonly rootConcept: Concept;
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
  const { title, onCancel, onCommit, actionText, initialCart, rootConcept } = props;
  const [cart, setCart] = useState<Concept[]>(initialCart);
  const columns = [
    { header: strong(['Table name']), width: 710, key: 'name' },
    { header: strong(['Table ID']), width: 195, key: 'id' },
    { header: strong(['Roll-up count']), width: 205, key: 'count' },
  ];

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
      h(StyledSimpleTable, {
        search: false,
        hierarchy: false,
        searchText: '',
        cart,
        setCart,
        onOpenHierarchy: () => {},
        concepts: rootConcept.children ? rootConcept.children : [],
        // domainOption unused
        domainOption: { kind: 'domain', id: 0, name: '', root: rootConcept },
        columns,
      }),
    ]),
    cart.length !== 0 &&
      h(ActionBar, {
        prompt: cart.length === 1 ? '1 table selected' : `${cart.length} tables selected`,
        actionText,
        onClick: () => _.flow(onCommit)(cart),
      }),
  ]);
};
