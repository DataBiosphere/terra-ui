import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { FlexTable, Sortable, tableHeight, TextCell } from 'src/components/table';
import { getOutputTableData, OutputTableData } from 'src/workflows-app/utils/submission-utils';

import { RecordUpdateOutputDestination } from '../models/submission-models';

const rowWidth = 100;
const rowHeight = 50;

const SubmissionDetailsOutputsTable = ({ configuredOutputDefinition }) => {
  const [sort, setSort] = useState({ field: '', direction: 'asc' });
  const outputTableData: OutputTableData[] = getOutputTableData(configuredOutputDefinition, sort);

  return div(
    {
      style: {
        backgroundColor: 'rgb(235, 236, 238)',
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        padding: '1rem 3rem',
      },
    },
    [
      div(
        {
          style: {
            height: tableHeight({
              actualRows: configuredOutputDefinition.length,
              maxRows: configuredOutputDefinition.length,
              heightPerRow: 50,
            }),
          },
        },
        [
          h(AutoSizer, [
            ({ width, height }) =>
              h(FlexTable, {
                'aria-label': 'input definition',
                width,
                height,
                // @ts-expect-error
                sort,
                rowCount: configuredOutputDefinition.length,
                noContentMessage: 'Nothing here yet! Your inputs for this submission will be displayed here.',
                hoverHighlight: true,
                rowHeight,
                rowWidth,
                columns: [
                  {
                    size: { basis: 350 },
                    field: 'taskName',
                    headerRenderer: () => h(Sortable, { sort, field: 'taskName', onSort: setSort }, ['Task Name']),
                    cellRenderer: ({ rowIndex }) => {
                      return h(TextCell, [outputTableData[rowIndex].taskName]);
                    },
                  },
                  {
                    size: { basis: 600, grow: 0 },
                    field: 'variable',
                    headerRenderer: () => h(Sortable, { sort, field: 'variable', onSort: setSort }, ['Variable']),
                    cellRenderer: ({ rowIndex }) => {
                      return h(TextCell, [outputTableData[rowIndex].variable]);
                    },
                  },
                  {
                    size: { basis: 500, grow: 0 },
                    field: 'outputTypeStr',
                    headerRenderer: () => h(Sortable, { sort, field: 'outputTypeStr', onSort: setSort }, ['Type']),
                    cellRenderer: ({ rowIndex }) => {
                      return h(TextCell, [outputTableData[rowIndex].outputTypeStr]);
                    },
                  },
                  {
                    size: { basis: 500, grow: 0 },
                    field: 'attribute',
                    headerRenderer: () => 'Attribute',
                    cellRenderer: ({ rowIndex }) => {
                      if (outputTableData[rowIndex].destination.type === 'record_update') {
                        const source: RecordUpdateOutputDestination = outputTableData[rowIndex]
                          .destination as RecordUpdateOutputDestination;
                        return h(TextCell, [source.record_attribute]);
                      }
                      return h(TextCell, []);
                    },
                  },
                ],
              }),
          ]),
        ]
      ),
    ]
  );
};

export default SubmissionDetailsOutputsTable;
