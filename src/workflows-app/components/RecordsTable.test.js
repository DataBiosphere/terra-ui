import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

    render(
      h(RecordsTable, {
        dataTableColumnWidths,
        setDataTableColumnWidths,
        dataTableRef,
        records,
        selectedRecords,
        setSelectedRecords,
        selectedDataTable,
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

  it('should change record table sort order when column headers are clicked', async () => {
    const dataTableColumnWidths = {};
    const setDataTableColumnWidths = jest.fn();
    const dataTableRef = { current: {} };
    const selectedRecords = {};
    const setSelectedRecords = jest.fn();
    const user = userEvent.setup();

    const records = [
      {
        id: 'FOO1',
        type: 'FOO',
        attributes: { sys_name: 'FOO1', foo_rating: 1000 },
      },
      {
        id: 'FOO2',
        type: 'FOO',
        attributes: { sys_name: 'FOO2', foo_rating: 999 },
      },
      {
        id: 'FOO3',
        type: 'FOO',
        attributes: { sys_name: 'FOO3', foo_rating: 85 },
      },
      {
        id: 'FOO4',
        type: 'FOO',
        attributes: { sys_name: 'FOO4', foo_rating: 30 },
      },
    ];

    const selectedDataTable = {
      name: 'FOO',
      attributes: [
        {
          name: 'foo_rating',
          datatype: 'NUMBER',
        },
        {
          name: 'bar_string',
          datatype: 'STRING',
        },
        {
          name: 'sys_name',
          datatype: 'STRING',
        },
      ],
      count: 4,
      primaryKey: 'sys_name',
    };

    render(
      h(RecordsTable, {
        dataTableColumnWidths,
        setDataTableColumnWidths,
        dataTableRef,
        records,
        selectedRecords,
        setSelectedRecords,
        selectedDataTable,
      })
    );

    const table = screen.getByRole('table');
    const rows = within(table).queryAllByRole('row');
    expect(rows.length).toBe(5);

    const headers = within(rows[0]).queryAllByRole('columnheader');
    expect(headers.length).toBe(5);

    const cells1 = within(rows[1]).queryAllByRole('cell');
    const cells2 = within(rows[2]).queryAllByRole('cell');
    const cells3 = within(rows[3]).queryAllByRole('cell');
    const cells4 = within(rows[4]).queryAllByRole('cell');

    within(cells1[1]).getByText('FOO1');
    within(cells2[1]).getByText('FOO2');
    within(cells3[1]).getByText('FOO3');
    within(cells4[1]).getByText('FOO4');

    await user.click(within(headers[1]).getByRole('button'));

    within(cells1[1]).getByText('FOO4');
    within(cells2[1]).getByText('FOO3');
    within(cells3[1]).getByText('FOO2');
    within(cells4[1]).getByText('FOO1');

    await user.click(within(headers[2]).getByRole('button'));
    within(cells1[2]).getByText('30');
    within(cells2[2]).getByText('85');
    within(cells3[2]).getByText('999');
    within(cells4[2]).getByText('1000');

    await user.click(within(headers[2]).getByRole('button'));
    within(cells1[2]).getByText('1000');
    within(cells2[2]).getByText('999');
    within(cells3[2]).getByText('85');
    within(cells4[2]).getByText('30');
  });
});
