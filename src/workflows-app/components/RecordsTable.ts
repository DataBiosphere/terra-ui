import _ from 'lodash/fp';
import { Dispatch, Fragment, SetStateAction, useEffect, useRef, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { Checkbox } from 'src/components/common';
import { GridTable, HeaderCell, Resizable, Sortable, TextCell } from 'src/components/table';
import {
  RecordAttributes,
  RecordResponse,
  RecordTypeSchema,
} from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import colors from 'src/libs/colors';
import { parseAttributeName } from 'src/workflows-app/utils/submission-utils';

const recordMap = (records: RecordResponse[]) => {
  return _.fromPairs(_.map((e) => [e.id, e], records));
};

type RecordsTableProps = {
  records: RecordResponse[];
  selectedRecords: Record<string, RecordResponse>;
  setSelectedRecords: Dispatch<SetStateAction<Record<string, RecordResponse>>>;
  selectedDataTable: RecordTypeSchema;
  totalRecordsInActualDataTable: number;
};

const RecordsTable = ({
  records,
  selectedRecords,
  setSelectedRecords,
  selectedDataTable,
  totalRecordsInActualDataTable,
}: RecordsTableProps) => {
  const [dataTableColumnWidths, setDataTableColumnWidths] = useState({});
  const dataTableRef = useRef<{ recomputeColumnSizes: () => void }>(null);
  const [recordsTableSort, setRecordsTableSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'id',
    direction: 'asc',
  });

  useEffect(() => {
    dataTableRef.current?.recomputeColumnSizes();
  }, [dataTableColumnWidths, records]);

  const selectAll = () => {
    setSelectedRecords(_.assign(selectedRecords, recordMap(records)));
  };

  const deselectAll = () => {
    setSelectedRecords({});
  };

  const allSelected = () => {
    const recordIds = _.map('id', records);
    const selectedIds = _.keys(selectedRecords);
    return records.length && _.every((k) => _.includes(k, selectedIds), recordIds);
  };

  const resizeColumn = (currentWidth, delta, columnKey) => {
    setDataTableColumnWidths(_.set(columnKey, currentWidth + delta));
  };

  const withDataTableNamePrefix = (columnName) => `${selectedDataTable.name}/${columnName}`;

  const recordsTableData = _.orderBy<RecordResponse & RecordAttributes>(
    [
      ({ [recordsTableSort.field]: field }) =>
        Number.isNaN((field as any) * 1) ? _.lowerCase(field as string) : (field as any) * 1, // converts field to int, float, or NaN (if field is a string)
    ],
    [recordsTableSort.direction],
    records.map((row) => ({
      ...row,
      ...row.attributes,
    }))
  );

  const renderCellData = (data) => {
    if (_.isObject(data) || _.isBoolean(data)) {
      return JSON.stringify(data);
    }
    return data;
  };

  return h(div, [
    div({ style: { fontStyle: 'italic', marginBottom: '1.5em' } }, [
      `Note: You are viewing ${records.length} out of ${totalRecordsInActualDataTable} records from the '${selectedDataTable.name}' data table`,
    ]),
    h(AutoSizer, { disableHeight: true }, [
      ({ width }) =>
        h(GridTable, {
          'aria-label': `${selectedDataTable.name} data table`,
          ref: dataTableRef,
          // @ts-ignore
          sort: recordsTableSort,
          width,
          height: (1 + recordsTableData.length) * 48,
          // Keeping these properties here as a reminder: can we use them?
          // noContentMessage: DEFAULT,
          // noContentRenderer: DEFAULT,
          rowCount: recordsTableData.length,
          numFixedColumns: 1,
          columns: [
            {
              width: 50,
              headerRenderer: () => {
                return h(Fragment, [
                  h(Checkbox, {
                    checked: allSelected(),
                    disabled: !recordsTableData.length,
                    onChange: allSelected() ? deselectAll : selectAll,
                    'aria-label': 'Select all',
                  }),
                ]);
              },
              cellRenderer: ({ rowIndex }) => {
                const thisRecord = recordsTableData[rowIndex];
                const { id } = thisRecord;
                const checked = _.has([id], selectedRecords);
                return h(Checkbox, {
                  'aria-label': id || 'id-pending',
                  checked,
                  onChange: () => {
                    setSelectedRecords((checked ? _.unset([id]) : _.set([id], thisRecord))(selectedRecords));
                  },
                });
              },
            },
            {
              field: 'id',
              width: dataTableColumnWidths[withDataTableNamePrefix('id')] || 300,
              headerRenderer: () => {
                const columnWidth = dataTableColumnWidths[withDataTableNamePrefix('id')] || 300;
                return h(
                  Resizable,
                  {
                    width: columnWidth,
                    onWidthChange: (delta) => resizeColumn(columnWidth, delta, withDataTableNamePrefix('id')),
                  },
                  [
                    h(
                      Sortable,
                      {
                        sort: recordsTableSort,
                        field: 'id',
                        onSort: setRecordsTableSort,
                      },
                      [h(HeaderCell, ['ID'])]
                    ),
                  ]
                );
              },
              cellRenderer: ({ rowIndex }) => {
                return h(TextCell, {}, [renderCellData(_.get('id', recordsTableData[rowIndex]))]);
              },
            },
            ..._.map(({ name: attributeName }) => {
              const columnWidth = dataTableColumnWidths[withDataTableNamePrefix(attributeName)] || 300;
              const { columnNamespace, columnName } = parseAttributeName(attributeName);
              return {
                field: attributeName,
                width: columnWidth,
                headerRenderer: () =>
                  h(
                    Resizable,
                    {
                      width: columnWidth,
                      onWidthChange: (delta) =>
                        resizeColumn(columnWidth, delta, withDataTableNamePrefix(attributeName)),
                    },
                    [
                      h(
                        Sortable,
                        {
                          sort: recordsTableSort,
                          field: attributeName,
                          onSort: setRecordsTableSort,
                        },
                        [
                          h(HeaderCell, [
                            !!columnNamespace &&
                              span(
                                { style: { fontStyle: 'italic', color: colors.dark(0.75), paddingRight: '0.2rem' } },
                                [columnNamespace]
                              ),
                            columnName,
                          ]),
                        ]
                      ),
                    ]
                  ),
                cellRenderer: ({ rowIndex }) => {
                  return h(TextCell, {}, [renderCellData(_.get(attributeName, recordsTableData[rowIndex]))]);
                },
              };
            }, selectedDataTable.attributes),
          ],
        }),
    ]),
  ]);
};

export default RecordsTable;
