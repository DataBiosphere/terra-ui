import { IconId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactElement } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { SimpleTable } from 'src/components/table';
import { tableHeaderStyle } from 'src/dataset-builder/ConceptSelector';
import { DomainOption, HighlightConceptName } from 'src/dataset-builder/DatasetBuilderUtils';
import { SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';

type StyledSimpleTableProps = {
  readonly search: boolean;
  readonly hierarchy: boolean;
  readonly searchText: string;
  readonly onOpenHierarchy: (
    domainOption: DomainOption,
    cart: Concept[],
    searchText: string,
    openedConcept?: Concept
  ) => void;
  readonly domainOption: DomainOption;
  readonly cart: Concept[];
  readonly setCart: (selected: Concept[]) => void;
  readonly concepts: Concept[];
  readonly columns: { header?: ReactElement<any, any>; width: number; key: string }[];
};

export const StyledSimpleTable = (props: StyledSimpleTableProps) => {
  const { search, searchText, hierarchy, onOpenHierarchy, domainOption, cart, setCart, concepts, columns } = props;
  const tableLeftPadding = { paddingLeft: '2rem' };

  return h(SimpleTable, {
    'aria-label': 'concept search results',
    underRowKey: 'underRow',
    rowStyle: {
      backgroundColor: 'white',
      ...tableLeftPadding,
    },
    headerRowStyle: {
      ...tableHeaderStyle,
      ...tableLeftPadding,
      marginTop: '1rem',
    },
    cellStyle: {
      paddingTop: 10,
      paddingBottom: 10,
    },
    columns,
    rows: _.map((concept) => {
      const [label, iconName]: [string, IconId] = _.contains(concept, cart)
        ? ['remove', 'minus-circle-red']
        : ['add', 'plus-circle-filled'];
      return {
        name: div({ style: { display: 'flex' } }, [
          h(Link, { 'aria-label': `${label} ${concept.id}`, onClick: () => setCart(_.xor(cart, [concept])) }, [
            icon(iconName, { size: 16 }),
          ]),
          search
            ? div({ style: { marginLeft: 5 } }, [
                h(HighlightConceptName, { conceptName: concept.name, searchFilter: searchText }),
              ])
            : div({ style: { marginLeft: 5 } }, [concept.name]),
        ]),
        id: concept.id,
        count: concept.count,
        hierarchy: hierarchy
          ? div({ style: { display: 'flex' } }, [
              h(
                Link,
                {
                  'aria-label': `open hierarchy ${concept.id}`,
                  onClick: () => onOpenHierarchy(domainOption, cart, searchText, concept),
                },
                [icon('view-list')]
              ),
              div({ style: { marginLeft: 5 } }, ['Hierarchy']),
            ])
          : {},
      };
    }, concepts),
  });
};
