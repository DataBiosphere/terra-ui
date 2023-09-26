import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { DelayedSearchInput } from 'src/components/input';
import { FlexTable, HeaderCell } from 'src/components/table';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';

import { renderDataCell } from '../data-table/entity-service/renderDataCell';
import { getReferenceData } from './reference-data-utils';

export const ReferenceDataContent = ({ workspace, referenceKey }) => {
  const {
    workspace: { attributes },
  } = workspace;
  const [textFilter, setTextFilter] = useState('');

  const selectedData = _.flow(
    _.filter(({ key, value }) => Utils.textMatch(textFilter, `${key} ${value}`)),
    _.sortBy('key')
  )(getReferenceData(attributes)[referenceKey]);

  return h(Fragment, [
    div(
      {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1rem',
          background: colors.light(0.5),
          borderBottom: `1px solid ${colors.grey(0.4)}`,
        },
      },
      [
        h(DelayedSearchInput, {
          'aria-label': 'Search',
          style: { width: 300 },
          placeholder: 'Search',
          onChange: setTextFilter,
          value: textFilter,
        }),
      ]
    ),
    div({ style: { flex: 1, margin: '0 0 1rem' } }, [
      h(AutoSizer, [
        ({ width, height }) =>
          h(FlexTable, {
            'aria-label': 'reference data',
            width,
            height,
            rowCount: selectedData.length,
            noContentMessage: 'No matching data',
            columns: [
              {
                size: { basis: 400, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Key']),
                cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].key, workspace),
              },
              {
                size: { grow: 1 },
                headerRenderer: () => h(HeaderCell, ['Value']),
                cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].value, workspace),
              },
            ],
            border: false,
          }),
      ]),
    ]),
  ]);
};
