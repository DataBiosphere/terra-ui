import { IconId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { ActionBar } from 'src/components/ActionBar';
import { Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { SimpleTable } from 'src/components/table';
import { StringInput } from 'src/data-catalog/create-dataset/CreateDatasetInputs';
import { SnapshotBuilderConcept as Concept, SnapshotBuilderDomainOption } from 'src/libs/ajax/DataRepo';
import { DatasetBuilder, GetConceptsResponse } from 'src/libs/ajax/DatasetBuilder';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import colors from 'src/libs/colors';

import { PAGE_PADDING_HEIGHT, PAGE_PADDING_WIDTH } from './constants';

type ConceptSearchProps = {
  readonly initialSearch: string;
  readonly domainOption: SnapshotBuilderDomainOption;
  readonly onCancel: () => void;
  readonly onCommit: (selected: Concept[]) => void;
  readonly onOpenHierarchy: (
    domainOption: SnapshotBuilderDomainOption,
    selected: Concept[],
    searchText: string
  ) => void;
  readonly actionText: string;
  readonly datasetId: string;
  readonly initialCart: Concept[];
};

export const ConceptSearch = (props: ConceptSearchProps) => {
  const { initialSearch, domainOption, onCancel, onCommit, onOpenHierarchy, actionText, datasetId, initialCart } =
    props;
  const [search, setSearch] = useState<string>(initialSearch);
  const [cart, setCart] = useState<Concept[]>(initialCart);
  const [concepts, searchConcepts] = useLoadedData<GetConceptsResponse>();
  useEffect(() => {
    void searchConcepts(() => {
      return DatasetBuilder().searchConcepts(datasetId, domainOption.root, search);
    });
  }, [search, datasetId, domainOption.root, searchConcepts]);
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
        div({ style: { marginLeft: 15 } }, [domainOption.category]),
      ]),
      h(StringInput, {
        onChange: (value: string) => {
          setSearch(value);
        },
        value: search,
        placeholder: 'Search',
      }),
      concepts.status === 'Ready'
        ? h(SimpleTable, {
            'aria-label': 'concept search results',
            underRowKey: 'underRow',
            rowStyle: { marginTop: 5, marginBottom: 5 },
            headerRowStyle: {
              height: '100%',
              display: 'flex',
              paddingTop: 15,
              paddingBottom: 15,
              backgroundColor: colors.light(0.4),
              borderRadius: '8px 8px 0px 0px',
              border: `.5px solid ${colors.dark(0.2)}`,
            },
            columns: [
              { header: 'Concept Name', width: 710, key: 'name' },
              { header: 'Concept ID', width: 195, key: 'id' },
              { header: 'Code', width: 195, key: 'code' },
              { header: 'Roll-up count', width: 205, key: 'count' },
              { header: ' ', width: 100, key: 'hierarchy' },
            ],
            rows: _.map((concept) => {
              const [label, iconName]: [string, IconId] = (() => {
                if (_.contains(concept, cart)) {
                  return ['remove', 'minus-circle-red'];
                }
                return ['add', 'plus-circle-filled'];
              })();
              return {
                name: div({ style: { display: 'flex' } }, [
                  h(Link, { 'aria-label': label, onClick: () => setCart(_.xor(cart, [concept])) }, [
                    icon(iconName, { size: 16 }),
                  ]),
                  div({ style: { marginLeft: 5 } }, [concept.name]),
                ]),
                id: concept.id,
                count: concept.count,
                hierarchy: div({ style: { display: 'flex' } }, [
                  h(
                    Link,
                    {
                      'aria-label': label,
                      onClick: () =>
                        onOpenHierarchy(
                          { id: concept.id, category: domainOption.category, root: concept },
                          cart,
                          search
                        ),
                    },
                    // FIXME: use font awsome list-tree
                    [icon('listAlt')]
                  ),
                  div({ style: { marginLeft: 5 } }, ['Hierarchy']),
                ]),
              };
            }, concepts.state.result),
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
