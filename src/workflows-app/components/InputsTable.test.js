import '@testing-library/jest-dom';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { getConfig } from 'src/libs/config';
import { delay } from 'src/libs/utils';
import InputsTable from 'src/workflows-app/components/InputsTable';
import { validateInputs } from 'src/workflows-app/components/submission-common';
import {
  runSetInputDef,
  runSetInputDefSameInputNames,
  runSetInputDefWithArrays,
  runSetInputDefWithSourceNone,
  runSetInputDefWithStruct,
  typesResponse,
  typesResponseWithoutFooRating,
} from 'src/workflows-app/components/test-data';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getCurrentUrl: jest.fn().mockReturnValue('terra'),
}));

jest.mock('src/libs/ajax');

jest.mock('src/libs/notifications.js');
jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

// SubmissionConfig component uses AutoSizer to determine the right size for table to be displayed. As a result we need to
// mock out the height and width so that when AutoSizer asks for the width and height of "browser" it can use the mocked
// values and render the component properly. Without this the tests will be break.
// (see https://github.com/bvaughn/react-virtualized/issues/493 and https://stackoverflow.com/a/62214834)
const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

const setupInputTableTest = ({ selectedDataTable = typesResponse[0], configuredInputDefinition = runSetInputDef, renderFn = render } = {}) => {
  const setConfiguredInputDefinition = jest.fn();
  const inputValidations = validateInputs(configuredInputDefinition, _.keyBy('name', selectedDataTable.attributes));

  const { rerender } = renderFn(
    h(InputsTable, {
      selectedDataTable,
      configuredInputDefinition,
      setConfiguredInputDefinition,
      inputValidations,
    })
  ) || { rerender: renderFn };

  setConfiguredInputDefinition.mockImplementation((newInputDefinitionOrFn) => {
    const newInputDefinition =
      typeof newInputDefinitionOrFn === 'function' ? newInputDefinitionOrFn(configuredInputDefinition) : newInputDefinitionOrFn;
    setupInputTableTest({
      selectedDataTable,
      configuredInputDefinition: newInputDefinition,
      renderFn: rerender,
    });
  });

  return {
    selectedDataTable,
    configuredInputDefinition,
    setConfiguredInputDefinition,
    inputValidations,
  };
};

describe('Input table source updates', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Record lookup only shows attributes with matching type', async () => {
    setupInputTableTest();

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    expect(rows.length).toBe(4);
    const cells1 = within(rows[1]).queryAllByRole('cell');
    const cells2 = within(rows[2]).queryAllByRole('cell');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating_workflow_var');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('Fetch from Data Table');
    const fooRecord = within(cells1[4]).getByText('foo_rating');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string_workflow_var');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Fetch from Data Table');
    const barRecord = within(cells2[4]).getByText('bar_string');

    // see what records are available for Int input (foo)
    // foo_rating is the only NUMBER attribute
    await userEvent.click(fooRecord);
    const fooRecordOptions = within(screen.getByRole('listbox')).getAllByText(/[[a-z]|[A-Z]|[0-9]]+/i);
    expect(fooRecordOptions).toHaveLength(1);

    // see what records are available for String input (bar)
    // bar_string and sys_name are STRING attributes, and foo_rating (NUMBER) can be coerced to string
    await userEvent.click(barRecord);
    const barRecordOptions = within(screen.getByRole('listbox')).getAllByText(/[[a-z]|[A-Z]|[0-9]]+/i);
    expect(barRecordOptions).toHaveLength(3);
  });
});

describe('Input table filters', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Searching filters the displayed rows', async () => {
    setupInputTableTest();

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    expect(rows.length).toBe(4);
    const cells1 = within(rows[1]).queryAllByRole('cell');
    const cells2 = within(rows[2]).queryAllByRole('cell');
    const cells3 = within(rows[3]).queryAllByRole('cell');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating_workflow_var');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('foo_rating');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string_workflow_var');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Fetch from Data Table');
    within(cells2[4]).getByText('bar_string');

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('optional_var');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('Type a Value');
    within(cells3[4]).getByDisplayValue('Hello World');

    // search for inputs belonging to target_workflow_1 task (removes foo_rating_workflow_var)
    const searchInput = await screen.getByLabelText('Search inputs');
    await userEvent.type(searchInput, 'target_wor');
    await act(() => delay(300)); // debounced search

    expect(within(table).queryAllByRole('row').length).toBe(3);

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('bar_string_workflow_var');
    within(cells1[2]).getByText('String');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('bar_string');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('optional_var');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Type a Value');
    within(cells2[4]).getByDisplayValue('Hello World');

    // search for inputs with rating in name
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'rating');
    await act(() => delay(300)); // debounced search

    expect(within(table).queryAllByRole('row').length).toBe(2);

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating_workflow_var');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('foo_rating');
  });
});

describe('Input source and requirements validation', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  beforeEach(() => {
    getConfig.mockReturnValue({ wdsUrlRoot: 'http://localhost:3000/wds' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  it('should display warning icon for required inputs with missing attributes and disappear when attribute is supplied', async () => {
    setupInputTableTest({ configuredInputDefinition: runSetInputDefWithStruct, selectedDataTable: typesResponseWithoutFooRating[0] });

    // ** ASSERT **
    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');

    expect(rows.length).toBe(runSetInputDefWithStruct.length + 1); // one row for each input definition variable, plus headers

    const cellsFoo = within(rows[1]).queryAllByRole('cell');
    expect(cellsFoo.length).toBe(5);
    within(cellsFoo[0]).getByText('foo');
    within(cellsFoo[1]).getByText('foo_rating_workflow_var');
    within(cellsFoo[2]).getByText('Int');
    within(cellsFoo[3]).getByText('Fetch from Data Table');
    // input configuration expects attribute 'foo_rating' to be present, but it isn't available in the data table.
    // Hence, the select box will be empty and defaulted to the attribute name as its placeholder,
    // but there will be a warning message next to it

    within(cellsFoo[4]).getByText('foo_rating');
    const warningMessageActive = within(cellsFoo[4]).queryByText("This attribute doesn't exist in the data table");
    expect(warningMessageActive).not.toBeNull();

    // ** ACT **
    // user selects the attribute 'rating_for_foo' for input 'foo_rating_workflow_var'
    await userEvent.click(within(cellsFoo[4]).getByText('foo_rating'));
    const selectOption = await screen.findByText('rating_for_foo');
    await userEvent.click(selectOption);

    // ** ASSERT **
    within(cellsFoo[4]).getByText('rating_for_foo');
    const warningMessageInactive = within(cellsFoo[4]).queryByText("This attribute doesn't exist in the data table");
    expect(warningMessageInactive).toBeNull(); // once user has selected an attribute, warning message should disappear
  });

  it('should display warning icon/message at each level of the struct builder when a field has a missing attribute', async () => {
    setupInputTableTest({ configuredInputDefinition: runSetInputDefWithStruct, selectedDataTable: typesResponseWithoutFooRating[0] });

    // ** ASSERT **
    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    const viewStructLink = within(rows[2]).getByText('View Struct');
    const inputWarningMessageActive = within(rows[2]).queryByText('This struct is missing a required input');
    expect(inputWarningMessageActive).not.toBeNull();

    // ** ACT **
    await userEvent.click(viewStructLink);

    // ** ASSERT **
    const structTable = await screen.getByLabelText('struct-table');
    const structRows = within(structTable).queryAllByRole('row');
    expect(structRows.length).toBe(6);

    const structCells = within(structRows[2]).queryAllByRole('cell');
    within(structCells[1]).getByText('myInnerStruct');
    const viewMyInnerStructLink = within(structCells[4]).getByText('View Struct');
    const structWarningMessageActive = within(structCells[4]).getByText('This struct is missing a required input');
    expect(structWarningMessageActive).not.toBeNull();

    // ** ACT **
    await userEvent.click(viewMyInnerStructLink);

    // ** ASSERT **
    const innerStructTable = await screen.getByLabelText('struct-table');
    const innerStructRows = within(innerStructTable).queryAllByRole('row');
    expect(innerStructRows.length).toBe(3);

    const innerStructCells = within(innerStructRows[2]).queryAllByRole('cell');
    within(innerStructCells[1]).getByText('myInnermostRecordLookup');
    within(innerStructCells[4]).getByText('foo_rating');
    const innerStructWarningMessageActive = within(innerStructCells[4]).queryByText("This attribute doesn't exist in the data table");
    expect(innerStructWarningMessageActive).not.toBeNull();

    // ** ACT **
    // user selects the attribute 'rating_for_foo' for input 'foo_rating_workflow_var'
    await userEvent.click(within(innerStructCells[4]).getByText('foo_rating'));
    const selectOption = await screen.findByText('rating_for_foo');
    await userEvent.click(selectOption);

    // ** ASSERT **
    within(innerStructCells[4]).getByText('rating_for_foo');
    const innerStructWarningMessageInactive = within(innerStructCells[4]).queryByText("This attribute doesn't exist in the data table");
    expect(innerStructWarningMessageInactive).toBeNull(); // once user has selected an attribute, warning message should disappear
  });

  it('should display warning for required inputs for a newly imported method', async () => {
    setupInputTableTest({ configuredInputDefinition: runSetInputDefWithSourceNone });

    // ** ASSERT **
    // check that warnings appear next to empty required inputs
    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');

    // inputs sorted according to task name -> variable name
    const firstInputRowCells = within(rows[1]).queryAllByRole('cell');
    within(firstInputRowCells[4]).getByText('This input is required');

    const thirdInputRowCells = within(rows[3]).queryAllByRole('cell');
    within(thirdInputRowCells[4]).getByText('Optional');

    // struct input
    const secondInputRowCells = within(rows[2]).queryAllByRole('cell');
    within(secondInputRowCells[4]).getByText('This input is required');

    // ** ACT **
    // user sets the source to 'Fetch from data table' for struct input
    await userEvent.click(within(secondInputRowCells[3]).getByText('Select Source'));
    const selectOption1 = await screen.findByText('Fetch from Data Table');
    await userEvent.click(selectOption1);

    // ** ASSERT **
    // check that the warning message for struct input hasn't changed since no attribute has been selected yet
    within(secondInputRowCells[4]).getByText('This attribute is required');

    // ** ACT **
    // user sets the source to 'Use Struct Builder' for struct input
    await userEvent.click(within(secondInputRowCells[3]).getByText('Fetch from Data Table'));
    const selectOption2 = await screen.findByText('Use Struct Builder');
    await userEvent.click(selectOption2);

    // ** ASSERT **
    // check that the warning message for struct input has changed
    within(secondInputRowCells[4]).getByText('This struct is missing a required input');

    // ** ACT **
    // click on View struct to open modal
    const viewStructLink = within(secondInputRowCells[4]).getByText('View Struct');
    await userEvent.click(viewStructLink);

    // ** ASSERT **
    const innerStructTable = await screen.getByLabelText('struct-table');
    const innerStructRows = within(innerStructTable).queryAllByRole('row');
    expect(innerStructRows.length).toBe(3);

    // check that warnings appear next to empty required inputs inside struct modal
    const innerStructRow1Cells = within(innerStructRows[2]).queryAllByRole('cell');
    within(innerStructRow1Cells[4]).getByText('This input is required');

    const innerStructRow2Cells = within(innerStructRows[1]).queryAllByRole('cell');
    within(innerStructRow2Cells[4]).getByText('Optional');

    // ** ACT **
    // user sets the source to 'Fetch from data table' for required struct input
    await userEvent.click(within(innerStructRow1Cells[3]).getByText('Select Source'));
    const selectOptionForStructInput = await screen.findByText('Fetch from Data Table');
    await userEvent.click(selectOptionForStructInput);

    // user exits the struct modal
    await userEvent.click(screen.getByText('Done'));

    // ** ASSERT **
    // check that the warning message for struct input still exists as it still has invalid input configurations
    within(secondInputRowCells[4]).getByText('This struct is missing a required input');
  });

  it('should display warning icon for input with value not matching expected type', async () => {
    setupInputTableTest({ configuredInputDefinition: runSetInputDefWithSourceNone });

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');

    const firstInputRowCells = within(rows[1]).queryAllByRole('cell');

    // user sets the source to 'Type a Value' for Int input
    await userEvent.click(within(firstInputRowCells[3]).getByText('Select Source'));
    const selectOption = await screen.findByText('Type a Value');
    await userEvent.click(selectOption);

    // ** ASSERT **
    // check that the warning message for input exists
    within(firstInputRowCells[4]).getByText('Value is empty');

    // ** ACT **
    // user types value for the Int input
    await userEvent.type(screen.getByLabelText('Enter a value'), '123X');

    // ** ASSERT **
    // check that the warning message for incorrect value is displayed
    within(firstInputRowCells[4]).getByText("Value doesn't match expected input type");

    // ** ACT **
    // user deletes the extra character
    await userEvent.type(screen.getByLabelText('Enter a value'), '{backspace}');

    // ** ASSERT **
    // check that the warning message for incorrect value is gone
    expect(within(firstInputRowCells[4]).queryByText(/Value is empty|Value doesn't match expected input type/)).toBeNull();
  });

  it('should display tooltips for array literals and convert inputs to array types', async () => {
    setupInputTableTest({ configuredInputDefinition: runSetInputDefWithArrays });

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');

    const firstInputRowCells = within(rows[1]).queryAllByRole('cell');

    // Value is already set to literal source from previous run
    await userEvent.click(within(firstInputRowCells[3]).getByText('Type a Value'));

    // ** ASSERT **
    // check the info message exists for `[]` input
    within(firstInputRowCells[4]).getByText('Successfully detected an array with 0 element(s).');

    // ** ACT **
    // user types value for the Array[Int] input
    await userEvent.click(within(firstInputRowCells[4]).getByLabelText('Enter a value'));
    await userEvent.keyboard('{ArrowLeft}X');

    // ** ASSERT **
    // check that the warning message for incorrect value is displayed
    within(firstInputRowCells[4]).getByText('Array inputs should follow JSON array literal syntax. This input cannot be parsed');

    // ** ACT **
    // user replaces with new array
    await userEvent.clear(within(firstInputRowCells[4]).getByLabelText('Enter a value'));
    expect(within(firstInputRowCells[4]).getByLabelText('Enter a value')).toHaveValue('');
    await userEvent.type(within(firstInputRowCells[4]).getByLabelText('Enter a value'), '[[1, 2]');

    // ** ASSERT **
    // check that validation message is updated
    within(firstInputRowCells[4]).getByText('Successfully detected an array with 2 element(s).');

    const secondInputRowCells = within(rows[2]).queryAllByRole('cell');

    // Value is not yet set
    await userEvent.click(within(secondInputRowCells[3]).getByText('None'));
    const selectOption = await within(screen.getByRole('listbox')).findByText('Type a Value');
    await userEvent.click(selectOption);

    // ** ASSERT **
    // check the warning message exists for empty input
    within(secondInputRowCells[4]).getByText(
      'Array inputs should follow JSON array literal syntax. This input is empty. To submit an empty array, enter []'
    );

    // ** ACT **
    // user types value for the Array[String] input
    await userEvent.click(within(secondInputRowCells[4]).getByLabelText('Enter a value'));
    await userEvent.keyboard('not an array');

    // ** ASSERT **
    // check that the warning message for incorrect value is displayed
    within(secondInputRowCells[4]).getByText(
      'Array inputs should follow JSON array literal syntax. This will be submitted as an array with one value: "not an array"'
    );
  });
});

describe('SubmissionConfig inputs/outputs definitions', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  beforeEach(() => {
    getConfig.mockReturnValue({ wdsUrlRoot: 'http://localhost:3000/wds' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  it('should change input table sort order when column headers are clicked', async () => {
    setupInputTableTest();

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    const headers = within(rows[0]).queryAllByRole('columnheader');
    const cells1 = within(rows[1]).queryAllByRole('cell');
    const cells2 = within(rows[2]).queryAllByRole('cell');
    const cells3 = within(rows[3]).queryAllByRole('cell');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating_workflow_var');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('foo_rating');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string_workflow_var');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Fetch from Data Table');
    within(cells2[4]).getByText('bar_string');

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('optional_var');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('Type a Value');
    within(cells3[4]).getByDisplayValue('Hello World');

    // sort ascending by column 1
    await act(async () => {
      await fireEvent.click(within(headers[1]).getByRole('button'));
    });

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('bar_string_workflow_var');
    within(cells1[2]).getByText('String');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('bar_string');

    within(cells2[0]).getByText('foo');
    within(cells2[1]).getByText('foo_rating_workflow_var');
    within(cells2[2]).getByText('Int');
    within(cells2[3]).getByText('Fetch from Data Table');
    within(cells2[4]).getByText('foo_rating');

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('optional_var');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('Type a Value');
    within(cells3[4]).getByDisplayValue('Hello World');

    // sort descending by column 1
    await act(async () => {
      await fireEvent.click(within(headers[1]).getByRole('button'));
    });

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('optional_var');
    within(cells1[2]).getByText('String');
    within(cells1[3]).getByText('Type a Value');
    within(cells1[4]).getByDisplayValue('Hello World');

    within(cells2[0]).getByText('foo');
    within(cells2[1]).getByText('foo_rating_workflow_var');
    within(cells2[2]).getByText('Int');
    within(cells2[3]).getByText('Fetch from Data Table');
    within(cells2[4]).getByText('foo_rating');

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('bar_string_workflow_var');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('Fetch from Data Table');
    within(cells3[4]).getByText('bar_string');
  });

  it('should populate fields from data table on click', async () => {
    setupInputTableTest({ configuredInputDefinition: runSetInputDefSameInputNames });

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    const cells1 = within(rows[1]).queryAllByRole('cell');
    const cells2 = within(rows[2]).queryAllByRole('cell');
    const cells3 = within(rows[3]).queryAllByRole('cell');

    screen.getByText('Autofill (2) from data table');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('None');
    within(cells1[4]).getByText(/Autofill /);
    const inputFillButton = within(cells1[4]).getByText('foo_rating');
    within(cells1[4]).getByText(/ from data table/);

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Select Source');
    within(cells2[4]).getByText(/Autofill /);
    within(cells2[4]).getByText('bar_string');
    within(cells2[4]).getByText(/ from data table/);
    within(cells2[4]).getByText('This attribute is required');

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('not_in_table');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('None');
    within(cells3[4]).getByText('Optional');

    // fill single input from click
    await act(async () => {
      await fireEvent.click(inputFillButton);
    });

    screen.getByText('Autofill (1) from data table');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating');
    within(cells1[2]).getByText('Int');
    const selectSourceDropdown = within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('foo_rating');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string');
    within(cells2[2]).getByText('String');
    within(cells2[4]).getByText(/Autofill /);
    within(cells2[4]).getByText('bar_string');
    within(cells2[4]).getByText(/ from data table/);

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('not_in_table');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('None');
    within(cells3[4]).getByText('Optional');

    // reset input
    await act(async () => {
      await userEvent.click(selectSourceDropdown);
      const selectOptionNone = within(screen.getByRole('listbox')).getByText('None');
      await userEvent.click(selectOptionNone);
    });

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('None');
    within(cells1[4]).getByText(/Autofill /);
    within(cells1[4]).getByText('foo_rating');
    within(cells1[4]).getByText(/ from data table/);

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string');
    within(cells2[2]).getByText('String');
    within(cells2[4]).getByText(/Autofill /);
    within(cells2[4]).getByText('bar_string');
    within(cells2[4]).getByText(/ from data table/);

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('not_in_table');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('None');
    within(cells3[4]).getByText('Optional');

    // fill all from data table
    await act(async () => {
      const fillAllButton = await screen.findByText('Autofill (2) from data table');
      await fireEvent.click(fillAllButton);
    });

    await screen.findByText('Autofill (0) from data table');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('foo_rating');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Fetch from Data Table');
    within(cells2[4]).getByText('bar_string');

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('not_in_table');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('None');
    within(cells3[4]).getByText('Optional');
  });

  it('should hide/show optional inputs when respective button is clicked', async () => {
    setupInputTableTest();

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    expect(rows.length).toBe(4);
    const cells1 = within(rows[1]).queryAllByRole('cell');
    const cells2 = within(rows[2]).queryAllByRole('cell');
    const cells3 = within(rows[3]).queryAllByRole('cell');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating_workflow_var');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('foo_rating');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string_workflow_var');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Fetch from Data Table');
    within(cells2[4]).getByText('bar_string');

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('optional_var');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('Type a Value');
    within(cells3[4]).getByDisplayValue('Hello World');

    // hide optional inputs (defaults to showing optional inputs)
    const hideButton = await screen.getByText('Hide optional inputs');
    await act(async () => {
      await fireEvent.click(hideButton);
    });
    await screen.findByText('Show optional inputs');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating_workflow_var');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('foo_rating');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string_workflow_var');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Fetch from Data Table');
    within(cells2[4]).getByText('bar_string');

    // show optional inputs again
    const showButton = await screen.getByText('Show optional inputs');
    await act(async () => {
      await fireEvent.click(showButton);
    });
    await screen.findByText('Hide optional inputs');

    within(cells1[0]).getByText('foo');
    within(cells1[1]).getByText('foo_rating_workflow_var');
    within(cells1[2]).getByText('Int');
    within(cells1[3]).getByText('Fetch from Data Table');
    within(cells1[4]).getByText('foo_rating');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('bar_string_workflow_var');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByText('Fetch from Data Table');
    within(cells2[4]).getByText('bar_string');

    within(cells3[0]).getByText('target_workflow_1');
    within(cells3[1]).getByText('optional_var');
    within(cells3[2]).getByText('String');
    within(cells3[3]).getByText('Type a Value');
    within(cells3[4]).getByDisplayValue('Hello World');
  });

  it('should display struct builder modal when "view struct builder" link is clicked', async () => {
    setupInputTableTest({ configuredInputDefinition: runSetInputDefWithStruct });

    // ** ASSERT **
    await screen.findByRole('table'); // there should be only one table at this point

    const viewStructLink = await screen.getByText('View Struct');
    await fireEvent.click(viewStructLink);
    await screen.getByText('myOptional');
    await screen.getByText('myInnerStruct');

    const structTable = await screen.getByLabelText('struct-table');
    const structRows = within(structTable).queryAllByRole('row');
    expect(structRows.length).toBe(6);

    const headers = within(structRows[0]).queryAllByRole('columnheader');
    within(headers[0]).getByText('Struct');
    within(headers[1]).getByText('Variable');
    within(headers[2]).getByText('Type');
    within(headers[3]).getByText('Input sources');
    within(headers[4]).getByText('Attribute');

    const structCells = within(structRows[2]).queryAllByRole('cell');
    within(structCells[1]).getByText('myInnerStruct');
    const viewMyInnerStructLink = within(structCells[4]).getByText('View Struct');

    await fireEvent.click(viewMyInnerStructLink);
    const myInnerStructTable = await screen.getByLabelText('struct-table');
    const myInnerStructRows = within(myInnerStructTable).queryAllByRole('row');
    expect(myInnerStructRows.length).toBe(3);

    const myInnerStructBreadcrumbs = await screen.getByLabelText('struct-breadcrumbs');
    const myInnerStructBreadcrumbsButtons = within(myInnerStructBreadcrumbs).queryAllByRole('button');
    expect(myInnerStructBreadcrumbsButtons.length).toBe(1);
    await fireEvent.click(myInnerStructBreadcrumbsButtons[0]);

    const structTable2ndView = await screen.getByLabelText('struct-table');
    const structRows2ndView = within(structTable2ndView).queryAllByRole('row');
    expect(structRows2ndView.length).toBe(6);

    const modalDoneButton = await screen.getByText('Done');
    fireEvent.click(modalDoneButton);
    await screen.findByRole('table'); // there should be only one table again
  });
});
