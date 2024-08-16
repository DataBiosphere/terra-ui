import { Spinner, useLoadedData } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { div, h, h2, strong } from 'react-hyperscript-helpers';
import { LabeledCheckbox, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextInput, withDebouncedChange } from 'src/components/input';
import { SimpleTable } from 'src/components/table';
import { ConceptCart } from 'src/dataset-builder/ConceptCart';
import { tableHeaderStyle } from 'src/dataset-builder/ConceptSelector';
import { BuilderPageHeader } from 'src/dataset-builder/DatasetBuilderHeader';
import { formatCount, HighlightConceptName } from 'src/dataset-builder/DatasetBuilderUtils';
import {
  DataRepo,
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderConceptsResponse,
  SnapshotBuilderDomainOption,
} from 'src/libs/ajax/DataRepo';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';

type ConceptSearchProps = {
  readonly initialSearch: string;
  readonly domainOption: SnapshotBuilderDomainOption;
  readonly onCancel: () => void;
  readonly onCommit: (selected: Concept[]) => void;
  readonly onOpenHierarchy: (
    domainOption: SnapshotBuilderDomainOption,
    cart: Concept[],
    searchText: string,
    openedConcept?: Concept
  ) => void;
  readonly actionText: string;
  readonly snapshotId: string;
  readonly initialCart: Concept[];
};

const DebouncedTextInput = withDebouncedChange(TextInput);
export const ConceptSearch = (props: ConceptSearchProps) => {
  const { initialSearch, domainOption, onCancel, onCommit, onOpenHierarchy, actionText, snapshotId, initialCart } =
    props;
  const [searchText, setSearchText] = useState<string>(initialSearch);
  const [cart, setCart] = useState<Concept[]>(initialCart);
  const [concepts, enumerateConcepts] = useLoadedData<SnapshotBuilderConceptsResponse>();

  const conceptsReady = concepts.status === 'Ready';
  const conceptsLength = conceptsReady && concepts.state.result.length;

  useEffect(() => {
    if (searchText.length === 0 || searchText.length > 2) {
      void enumerateConcepts(
        withErrorReporting(`Error searching concepts with term ${searchText}`)(async () => {
          return DataRepo().snapshot(snapshotId).enumerateConcepts(domainOption.root, searchText);
        })
      );
    }
  }, [searchText, snapshotId, domainOption.root, enumerateConcepts]);
  const tableLeftPadding = { paddingLeft: '2rem' };
  const iconSize = 18;

  const conceptTableTextForSearch = `${conceptsReady && conceptsLength === 0 ? 'No ' : ''}Results for ${searchText}`;

  const conceptTableTextForNoSearch = conceptsReady
    ? `Top ${conceptsLength} results for ${domainOption.name}`
    : 'Loading data table';

  const conceptTableText = () => {
    return div(
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: '2rem 0 0 2rem',
          fontWeight: 800,
          height: '3.5rem',
        },
      },
      [
        searchText.length > 2 ? conceptTableTextForSearch : conceptTableTextForNoSearch,
        ...(conceptsReady ? [] : [h(Spinner, { size: 20, style: { marginLeft: '1rem' } })]),
      ]
    );
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
        div({ style: { marginLeft: 15 } }, [domainOption.name]),
      ]),
      div({ style: { position: 'relative' } }, [
        h(DebouncedTextInput, {
          onChange: (value: string) => {
            setSearchText(value);
          },
          value: searchText,
          placeholder: 'Search',
          type: 'search',
          style: {
            borderRadius: 25,
            borderColor: colors.dark(0.2),
            width: '100%',
            maxWidth: 575,
            height: '3rem',
            marginRight: 20,
            paddingLeft: 40,
          },
        }),
        icon('search', {
          size: iconSize,
          style: { position: 'absolute', left: 15, top: '50%', marginTop: -(iconSize / 2) },
        }),
      ]),
      conceptTableText(),
      h(SimpleTable, {
        'aria-label': 'concept search results',
        underRowKey: 'underRow',
        rowStyle: {
          backgroundColor: 'white',
          ...tableLeftPadding,
          paddingRight: '2rem',
        },
        headerRowStyle: {
          ...tableHeaderStyle,
          ...tableLeftPadding,
          paddingRight: '2rem',
          marginTop: '1rem',
        },
        cellStyle: {
          paddingTop: 13,
          paddingBottom: 13,
        },
        columns: [
          { header: strong(['Concept name']), key: 'name', size: { grow: 2.3 } },
          { header: strong(['Concept ID']), key: 'id', size: { grow: 0.5 } },
          { header: strong(['Code']), key: 'code', size: { grow: 0.75 } },
          { header: strong(['# Participants']), key: 'count', size: { grow: 0.5 } },
          { key: 'hierarchy', size: { grow: 0.4 } },
        ],
        rows: _.map((concept) => {
          return {
            name: div({ style: { display: 'flex' } }, [
              h(
                LabeledCheckbox,
                {
                  style: { paddingRight: 22, marginTop: 1 },
                  checked: _.contains(concept, cart),
                  onChange: () => setCart(_.xor(cart, [concept])),
                },
                [
                  h(HighlightConceptName, {
                    conceptName: concept.name,
                    searchFilter: searchText,
                  }),
                ]
              ),
            ]),
            id: concept.id,
            code: concept.code,
            count: formatCount(concept.count),
            hierarchy: div({ style: { display: 'flex' } }, [
              h(
                Link,
                {
                  'aria-label': `open hierarchy ${concept.id}`,
                  onClick: () => onOpenHierarchy(domainOption, cart, searchText, concept),
                },
                [icon('view-list')]
              ),
              div({ style: { marginLeft: 5 } }, ['Hierarchy']),
            ]),
          };
        }, concepts.state?.result || []),
      }),
    ]),
    h(ConceptCart, { actionText, cart, onCommit }),
  ]);
};
