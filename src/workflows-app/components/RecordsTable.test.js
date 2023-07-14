import '@testing-library/jest-dom';

import { render, screen, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import RecordsTable from 'src/workflows-app/components/RecordsTable';

describe('RecordsTable', () => {
  const mockRecordsData = [
    {
      id: 'foo_id',
      type: 'foo-data',
      attributes: {
        foo_name: 'FOO',
        foo_boolean: true,
        foo_int: 123,
        foo_float: 12.34,
        foo_date: '2023-06-16',
        foo_file: 'https://datasettoaexample.blob.core.windows.net/dataset/abc.genome.fa',
        foo_array_of_string: ['this', 'is', 'a', 'string', 'array'],
        foo_array_of_files: [
          'https://datasettoaexample.blob.core.windows.net/dataset/abc.fastq.gz',
          'https://datasettoaexample.blob.core.windows.net/dataset/xyz.fastq.gz',
        ],
        foo_struct: { foo_tries: 3, agg_foo_tries: 3, nested_foo_struct: { foo_rating: 4.5, bar_rating: 2.4 } },
      },
    },
  ];

  const mockDataTable = {
    name: 'foo-data',
    attributes: [
      {
        name: 'foo_name',
        datatype: 'STRING',
      },
      {
        name: 'foo_boolean',
        datatype: 'BOOLEAN',
      },
      {
        name: 'foo_int',
        datatype: 'NUMBER',
      },
      {
        name: 'foo_float',
        datatype: 'NUMBER',
      },
      {
        name: 'foo_date',
        datatype: 'DATE',
      },
      {
        name: 'foo_file',
        datatype: 'FILE',
      },
      {
        name: 'foo_array_of_string',
        datatype: 'ARRAY_OF_STRING',
      },
      {
        name: 'foo_array_of_files',
        datatype: 'ARRAY_OF_FILE',
      },
      {
        name: 'foo_struct',
        datatype: 'JSON',
      },
    ],
    count: 1,
    primaryKey: 'sample_id',
  };

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800000 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Render data as expected', async () => {
    const dataTableColumnWidths = {};
    const setDataTableColumnWidths = jest.fn();
    const dataTableRef = { current: {} };
    const records = mockRecordsData;
    const selectedRecords = {};
    const setSelectedRecords = jest.fn();
    const selectedDataTable = mockDataTable;
    const recordsTableSort = { field: 'id', direction: 'asc' };
    const setRecordsTableSort = jest.fn();

    render(
      h(RecordsTable, {
        dataTableColumnWidths,
        setDataTableColumnWidths,
        dataTableRef,
        records,
        selectedRecords,
        setSelectedRecords,
        selectedDataTable,
        recordsTableSort,
        setRecordsTableSort,
      })
    );

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    expect(rows.length).toBe(2);

    const dataRow = within(rows[1]).queryAllByRole('cell');
    within(dataRow[1]).getByText('foo_id');
    within(dataRow[2]).getByText('FOO');
    within(dataRow[3]).getByText('true');
    within(dataRow[4]).getByText('123');
    within(dataRow[5]).getByText('12.34');
    within(dataRow[6]).getByText('2023-06-16');
    within(dataRow[7]).getByText('https://datasettoaexample.blob.core.windows.net/dataset/abc.genome.fa');
    within(dataRow[8]).getByText('["this","is","a","string","array"]');
    within(dataRow[9]).getByText(
      '["https://datasettoaexample.blob.core.windows.net/dataset/abc.fastq.gz","https://datasettoaexample.blob.core.windows.net/dataset/xyz.fastq.gz"]'
    );
    within(dataRow[10]).getByText('{"foo_tries":3,"agg_foo_tries":3,"nested_foo_struct":{"foo_rating":4.5,"bar_rating":2.4}}');
  });
});
