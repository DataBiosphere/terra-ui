import { ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { FlexTable, Sortable, TextCell } from 'src/components/table';
import { WorkflowTableColumnNames } from 'src/libs/workflow-utils';
import { getOutputTableData, OutputTableData } from 'src/workflows-app/utils/submission-utils';

import { OutputDefinition, RecordUpdateOutputDestination } from '../models/submission-models';
import { tableContainerStyle, tableStyle } from './submission-tables-styles';

const rowWidth = 100;
const rowHeight = 50;

type SubmissionDetailsOutputsTableProps = {
  configuredOutputDefinition: OutputDefinition[];
};

const SubmissionDetailsOutputsTable = ({
  configuredOutputDefinition,
}: SubmissionDetailsOutputsTableProps): ReactNode => {
  const [sort, setSort] = useState({ field: '', direction: 'asc' });
  const outputTableData: OutputTableData[] = getOutputTableData(configuredOutputDefinition, sort);

  return div({ style: tableContainerStyle }, [
    div({ style: tableStyle(outputTableData.length) }, [
      h(AutoSizer, [
        ({ width, height }) =>
          h(FlexTable, {
            'aria-label': 'output definition',
            width,
            height,
            sort: sort as any, // necessary until FlexTable is converted to TS
            rowCount: configuredOutputDefinition.length,
            noContentMessage: 'Nothing here yet! Your outputs for this submission will be displayed here.',
            hoverHighlight: true,
            rowHeight,
            rowWidth,
            variant: null,
            tabIndex: -1,
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
                headerRenderer: () => WorkflowTableColumnNames.OUTPUT_NAME,
                cellRenderer: ({ rowIndex }) => {
                  if (outputTableData[rowIndex].destination.type === 'record_update') {
                    const destination: RecordUpdateOutputDestination = outputTableData[rowIndex]
                      .destination as RecordUpdateOutputDestination;
                    return h(TextCell, [destination.record_attribute]);
                  }
                  return h(TextCell, []);
                },
              },
            ],
          }),
      ]),
    ]),
  ]);
};

export default SubmissionDetailsOutputsTable;
