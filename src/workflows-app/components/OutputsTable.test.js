import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import OutputsTable from 'src/workflows-app/components/OutputsTable';
import { runSetOutputDef, runSetOutputDefWithDefaults } from 'src/workflows-app/utils/mock-responses';

const setupOutputTableTest = ({ configuredOutputDefinition = runSetOutputDef } = {}) => {
  const setConfiguredOutputDefinition = jest.fn();

  const { rerender } = render(
    h(OutputsTable, {
      configuredOutputDefinition,
      setConfiguredOutputDefinition,
    })
  );

  return {
    configuredOutputDefinition,
    setConfiguredOutputDefinition,
    rerender,
  };
};

describe('Output table rendering', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  it('should render output variable names accurately', async () => {
    setupOutputTableTest();

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const cells1 = within(rows[1]).getAllByRole('cell');
    const cells2 = within(rows[2]).getAllByRole('cell');

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('file_output');
    within(cells1[2]).getByText('File');
    within(cells1[3]).getByDisplayValue('target_workflow_1_file_output');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('unused_output');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByDisplayValue('');
  });

  it('should change output table sort order when column headers are clicked', async () => {
    setupOutputTableTest();
    const user = userEvent.setup();

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const headers = within(rows[0]).getAllByRole('columnheader');
    const cells1 = within(rows[1]).getAllByRole('cell');
    const cells2 = within(rows[2]).getAllByRole('cell');

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('file_output');
    within(cells1[2]).getByText('File');
    within(cells1[3]).getByDisplayValue('target_workflow_1_file_output');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('unused_output');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByDisplayValue('');

    // sort ascending by column 1
    await user.click(within(headers[1]).getByRole('button'));

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('file_output');
    within(cells1[2]).getByText('File');
    within(cells1[3]).getByDisplayValue('target_workflow_1_file_output');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('unused_output');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByDisplayValue('');

    // sort descending by column 1
    await user.click(within(headers[1]).getByRole('button'));

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('unused_output');
    within(cells1[2]).getByText('String');
    within(cells1[3]).getByDisplayValue('');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('file_output');
    within(cells2[2]).getByText('File');
    within(cells2[3]).getByDisplayValue('target_workflow_1_file_output');
  });
});

describe('Output table definition updates', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  it('should set output variable names when set defaults button is clicked', async () => {
    const { setConfiguredOutputDefinition } = setupOutputTableTest();
    const user = userEvent.setup();

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const headers = within(rows[0]).getAllByRole('columnheader');

    // set defaults
    await user.click(within(headers[3]).getByRole('button'));

    expect(setConfiguredOutputDefinition).toHaveBeenCalledWith(runSetOutputDefWithDefaults);
  });
});
