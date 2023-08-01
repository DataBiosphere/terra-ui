import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { h, span } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { Checkbox } from 'src/components/common';
import { GridTable, HeaderCell, Resizable, Sortable, TextCell } from 'src/components/table';
import colors from 'src/libs/colors';
import { parseAttributeName } from 'src/workflows-app/utils/submission-utils';

const recordMap = (records) => {
  return _.fromPairs(_.map((e) => [e.id, e], records));
};

const RecordsTable = (props) => {
  const { dataTableColumnWidths, setDataTableColumnWidths, dataTableRef, records, selectedRecords, setSelectedRecords, selectedDataTable } = props;

  const [recordsTableSort, setRecordsTableSort] = useState({ field: 'id', direction: 'asc' });

  const selectPage = () => {
    setSelectedRecords(_.assign(selectedRecords, recordMap(records)));
  };

  const deselectPage = () => {
    setSelectedRecords(
      _.omit(
        _.map(({ id }) => [id], records),
        selectedRecords
      )
    );
  };

  const pageSelected = () => {
    const recordIds = _.map('id', records);
    const selectedIds = _.keys(selectedRecords);
    return records.length && _.every((k) => _.includes(k, selectedIds), recordIds);
  };

  const resizeColumn = (currentWidth, delta, columnKey) => {
    setDataTableColumnWidths(_.set(columnKey, currentWidth + delta));
  };

  const withDataTableNamePrefix = (columnName) => `${selectedDataTable.name}/${columnName}`;

  const recordsTableData = _.flow(
    _.map((row) =>
      _.merge(
        row,
        _.forEach((a) => _.set(a, _.get(`attributes.${a}`, row), row), row.attributes)
      )
    ),
    _.orderBy(
      [
        ({ [recordsTableSort.field]: field }) => field * 1, // converts field to int, float, or NaN (if field is a string)
        ({ [recordsTableSort.field]: field }) => _.lowerCase(field),
      ],
      [recordsTableSort.direction]
    )
  )(records);

  const renderCellData = (data) => {
    if (_.isObject(data) || _.isBoolean(data)) {
      return JSON.stringify(data);
    }
    return data;
  };

  return h(AutoSizer, [
    ({ width, height }) => {
      return h(
        GridTable,
        {
          'aria-label': `${selectedDataTable.name} data table`,
          ref: dataTableRef,
          width,
          height,
          sort: recordsTableSort,
          // // Keeping these properties here as a reminder: can we use them?
          // noContentMessage: DEFAULT,
          // noContentRenderer: DEFAULT,
          rowCount: recordsTableData.length,
          columns: [
            {
              width: 70,
              headerRenderer: () => {
                return h(Fragment, [
                  h(Checkbox, {
                    checked: pageSelected(),
                    disabled: !recordsTableData.length,
                    onChange: pageSelected() ? deselectPage : selectPage,
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
                      onWidthChange: (delta) => resizeColumn(columnWidth, delta, withDataTableNamePrefix(attributeName)),
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
                              span({ style: { fontStyle: 'italic', color: colors.dark(0.75), paddingRight: '0.2rem' } }, [columnNamespace]),
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
        },
        []
      );
    },
  ]);
};

export default RecordsTable;
