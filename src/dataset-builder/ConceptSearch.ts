import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { div, h, h2, strong } from 'react-hyperscript-helpers';
import { ActionBar } from 'src/components/ActionBar';
import { Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextInput, withDebouncedChange } from 'src/components/input';
import { BuilderPageHeader } from 'src/dataset-builder/DatasetBuilderHeader';
import { DomainOption, GetConceptsResponse } from 'src/dataset-builder/DatasetBuilderUtils';
import { StyledSimpleTable } from 'src/dataset-builder/StyledSimpleTable';
import { DataRepo, SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';

type ConceptSearchProps = {
  readonly initialSearch: string;
  readonly domainOption: DomainOption;
  readonly onCancel: () => void;
  readonly onCommit: (selected: Concept[]) => void;
  readonly onOpenHierarchy: (
    domainOption: DomainOption,
    cart: Concept[],
    searchText: string,
    openedConcept?: Concept
  ) => void;
  readonly actionText: string;
  readonly datasetId: string;
  readonly initialCart: Concept[];
};

const DebouncedTextInput = withDebouncedChange(TextInput);
export const ConceptSearch = (props: ConceptSearchProps) => {
  const { initialSearch, domainOption, onCancel, onCommit, onOpenHierarchy, actionText, datasetId, initialCart } =
    props;
  const [searchText, setSearchText] = useState<string>(initialSearch);
  const [cart, setCart] = useState<Concept[]>(initialCart);
  const [concepts, searchConcepts] = useLoadedData<GetConceptsResponse>();

  useEffect(() => {
    if (searchText.length === 0 || searchText.length > 2) {
      void searchConcepts(() => {
        return DataRepo().dataset(datasetId).searchConcepts(domainOption.root, searchText);
      });
    }
  }, [searchText, datasetId, domainOption.root, searchConcepts]);
  const iconSize = 18;

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
      concepts.status === 'Ready'
        ? h(StyledSimpleTable, {
            search: true,
            hierarchy: true,
            searchText,
            cart,
            setCart,
            onOpenHierarchy,
            concepts: concepts.state.result,
            domainOption,
            columns: [
              { header: strong(['Concept name']), width: 710, key: 'name' },
              { header: strong(['Concept ID']), width: 195, key: 'id' },
              { header: strong(['Code']), width: 195, key: 'code' },
              { header: strong(['Roll-up count']), width: 205, key: 'count' },
              { width: 100, key: 'hierarchy' },
            ],
          })
        : spinnerOverlay,
    ]),
    cart.length !== 0 &&
      h(ActionBar, {
        prompt: cart.length === 1 ? '1 concept selected' : `${cart.length} concepts selected`,
        actionText,
        onClick: () => _.flow(onCommit)(cart),
      }),
  ]);
};
