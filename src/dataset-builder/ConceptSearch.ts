import { ExternalLink, PopupTrigger, Spinner, useLoadedData } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { div, h, h2, p, strong } from 'react-hyperscript-helpers';
import { LabeledCheckbox, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextInput, withDebouncedChange } from 'src/components/input';
import { SimpleTable } from 'src/components/table';
import { ConceptCart } from 'src/dataset-builder/ConceptCart';
import { tableHeaderStyle } from 'src/dataset-builder/ConceptSelector';
import { BuilderPageHeader } from 'src/dataset-builder/DatasetBuilderHeader';
import { formatCount, HighlightSearchText } from 'src/dataset-builder/DatasetBuilderUtils';
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

  const columnHeadersInfoSpacing = { marginTop: 4, marginBottom: 24 };

  const conceptTableText = () => {
    return div(
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: '2rem 2rem 0 2rem',
          fontWeight: 800,
          height: '3.5rem',
          justifyContent: 'space-between',
        },
      },
      [
        div({ style: { display: 'flex', alignItems: 'center' } }, [
          searchText.length > 2 ? conceptTableTextForSearch : conceptTableTextForNoSearch,
          ...(conceptsReady ? [] : [h(Spinner, { size: 20, style: { marginLeft: '1rem' } })]),
        ]),
        div({ style: { display: 'flex', paddingLeft: 10 } }, [
          h(
            PopupTrigger,
            {
              side: 'right-aligned-bottom',
              content: div({ style: { padding: 16, overflowWrap: 'break-word', width: '30rem' } }, [
                strong(['Concept name:']),
                p({ style: columnHeadersInfoSpacing }, [
                  'A descriptive label for each Concept across all domains from the OMOP CDM.',
                ]),
                strong(['Concept ID:']),
                p({ style: columnHeadersInfoSpacing }, [
                  'A unique identifier for each Concept across all domains from the OMOP CDM.',
                ]),
                strong(['Code:']),
                p({ style: columnHeadersInfoSpacing }, [
                  'Represents the identifier of the Concept in the source vocabulary, such as SNOMED-CT concept IDs, RxNorm RXCUIs etc. Note that concept codes are not unique across vocabularies.',
                ]),
                strong(['# Participants']),
                p({ style: columnHeadersInfoSpacing }, [
                  'The total number of unique participants in the dataset who are associated with or have exhibited this specific concept.',
                ]),
                p([
                  'Learn more about the ',
                  h(
                    ExternalLink,
                    { style: { textDecoration: 'underline' }, href: 'https://www.ohdsi.org/data-standardization/' },
                    ['OMOP Common Data Model']
                  ),
                ]),
              ]),
            },
            [h(Link, { style: { textDecoration: 'underline' } }, ['Column Headers Defined', icon('caretDown')])]
          ),
        ]),
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
          lineHeight: '22px',
        },
        columns: [
          { header: strong(['Concept name']), key: 'name', size: { grow: 2.5 } },
          { header: strong(['Concept ID']), key: 'id', size: { grow: 0.75 } },
          { header: strong(['Code']), key: 'code', size: { grow: 0.75 } },
          { header: strong(['# Participants']), key: 'count', size: { grow: 0.75 } },
          { key: 'hierarchy', size: { grow: 0.75 } },
        ],
        rows: _.map(
          (concept) => {
            return {
              name: div({ style: { display: 'flex', paddingRight: 14 } }, [
                h(
                  LabeledCheckbox,
                  {
                    style: { paddingRight: 24, marginTop: 4 },
                    checked: _.contains(concept, cart),
                    onChange: () => setCart(_.xor(cart, [concept])),
                  },
                  [
                    h(HighlightSearchText, {
                      columnItem: concept.name,
                      searchFilter: searchText,
                    }),
                  ]
                ),
              ]),
              id: h(HighlightSearchText, {
                columnItem: concept.id.toString(),
                searchFilter: searchText,
              }),
              code: h(HighlightSearchText, {
                columnItem: concept.code,
                searchFilter: searchText,
                style: { overflowX: 'hidden', textOverflow: 'ellipsis', paddingRight: 14 },
              }),
              count: formatCount(concept.count),
              hierarchy: div({ style: { display: 'flex' } }, [
                h(
                  Link,
                  {
                    'aria-label': `open hierarchy ${concept.id}`,
                    onClick: () => onOpenHierarchy(domainOption, cart, searchText, concept),
                    style: { marginTop: 1.5 },
                  },
                  [icon('view-list')]
                ),
                div({ style: { marginLeft: 5 } }, ['Hierarchy']),
              ]),
            };
          },
          conceptsReady ? concepts.state.result : []
        ),
      }),
    ]),
    h(ConceptCart, { actionText, cart, onCommit }),
  ]);
};
