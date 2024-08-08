import { ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { FlexTable, Sortable, TextCell } from 'src/components/table';
import { WorkflowTableColumnNames } from 'src/libs/workflow-utils';
import { getInputTableData, InputTableData } from 'src/workflows-app/utils/submission-utils';

import { InputDefinition, LiteralInputSource, RecordLookupInputSource } from '../models/submission-models';
import { tableContainerStyle, tableStyle } from './submission-tables-styles';

const rowWidth = 100;
const rowHeight = 50;

type SubmissionDetailsInputsTableProps = {
  configuredInputDefinition: InputDefinition[];
};

const SubmissionDetailsInputsTable = ({ configuredInputDefinition }: SubmissionDetailsInputsTableProps): ReactNode => {
  const [sort, setSort] = useState<{
    field: 'taskName' | 'variable';
    direction: 'asc' | 'desc';
  }>({
    field: 'taskName',
    direction: 'asc',
  });

  const includeOptionalInputs = true;
  const searchFilter = '';

  const inputTableData: InputTableData[] = getInputTableData(
    configuredInputDefinition,
    searchFilter,
    includeOptionalInputs,
    sort
  );

  return div(
    {
      style: tableContainerStyle,
    },
    [
      div({ style: tableStyle(inputTableData.length) }, [
        h(AutoSizer, [
          ({ width, height }) =>
            h(FlexTable, {
              'aria-label': 'input definition',
              width,
              height,
              sort: sort as any, // necessary until FlexTable is converted to TS
              rowCount: configuredInputDefinition.length,
              noContentMessage: 'Nothing here yet! Your inputs for this submission will be displayed here.',
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
                    return h(TextCell, [inputTableData[rowIndex].taskName]);
                  },
                },
                {
                  size: { basis: 600, grow: 0 },
                  field: 'variable',
                  headerRenderer: () => h(Sortable, { sort, field: 'variable', onSort: setSort }, ['Variable']),
                  cellRenderer: ({ rowIndex }) => {
                    return h(TextCell, [inputTableData[rowIndex].variable]);
                  },
                },
                {
                  size: { basis: 500, grow: 0 },
                  field: 'inputTypeStr',
                  headerRenderer: () => h(Sortable, { sort, field: 'inputTypeStr', onSort: setSort }, ['Type']),
                  cellRenderer: ({ rowIndex }) => {
                    return h(TextCell, [inputTableData[rowIndex].inputTypeStr]);
                  },
                },
                {
                  size: { basis: 500, grow: 0 },
                  field: 'inputSources',
                  headerRenderer: () => 'Input Source',
                  cellRenderer: ({ rowIndex }) => {
                    return h(TextCell, [inputTableData[rowIndex].source.type]);
                  },
                },
                {
                  size: { basis: 500, grow: 0 },
                  field: 'attribute',
                  headerRenderer: () => WorkflowTableColumnNames.INPUT_VALUE,
                  cellRenderer: ({ rowIndex }) => {
                    if (inputTableData[rowIndex].source.type === 'record_lookup') {
                      const source: RecordLookupInputSource = inputTableData[rowIndex]
                        .source as RecordLookupInputSource;
                      return h(TextCell, [source.record_attribute]);
                    }
                    if (inputTableData[rowIndex].source.type === 'literal') {
                      const source: LiteralInputSource = inputTableData[rowIndex].source as LiteralInputSource;
                      return h(TextCell, [source.parameter_value]);
                    }
                    return h(TextCell, []);
                  },
                },
              ],
            }),
        ]),
      ]),
    ]
  );
};

export default SubmissionDetailsInputsTable;
