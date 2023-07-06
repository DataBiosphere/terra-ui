import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import OutputsTable from 'src/workflows-app/components/OutputsTable';
import { runSetOutputDef, runSetOutputDefWithDefaults } from 'src/workflows-app/components/test-data';

const setupOutputTableTest = ({
  configuredOutputDefinition = runSetOutputDef,
  setConfiguredOutputDefinition = jest.fn(),
  renderFn = render,
} = {}) => {
  const { rerender } = renderFn(
    h(OutputsTable, {
      configuredOutputDefinition,
      setConfiguredOutputDefinition,
    })
  ) || { rerender: renderFn };

  setConfiguredOutputDefinition.mockImplementation((newOutputDefinitionOrFn) => {
    const newOutputDefinition =
      typeof newOutputDefinitionOrFn === 'function' ? newOutputDefinitionOrFn(configuredOutputDefinition) : newOutputDefinitionOrFn;
    setupOutputTableTest({
      configuredOutputDefinition: newOutputDefinition,
      setConfiguredOutputDefinition,
      renderFn: rerender,
    });
    return newOutputDefinition;
  });

  return {
    getConfiguredOutputDefinition: () => setConfiguredOutputDefinition(_.identity),
    setConfiguredOutputDefinition,
  };
};

describe('Output table', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set output variable names when set defaults button is clicked', async () => {
    const { getConfiguredOutputDefinition } = setupOutputTableTest();

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    const headers = within(rows[0]).queryAllByRole('columnheader');
    const cells1 = within(rows[1]).queryAllByRole('cell');
    const cells2 = within(rows[2]).queryAllByRole('cell');

    // prepopulated values
    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('file_output');
    within(cells1[2]).getByText('File');
    within(cells1[3]).getByDisplayValue('target_workflow_1_file_output');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('unused_output');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByDisplayValue('');

    // set defaults
    await act(async () => {
      await userEvent.click(within(headers[3]).getByRole('button'));
    });

    expect(getConfiguredOutputDefinition()).toStrictEqual(runSetOutputDefWithDefaults);

    // default values
    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('file_output');
    within(cells1[2]).getByText('File');
    within(cells1[3]).getByDisplayValue('file_output');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('unused_output');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByDisplayValue('unused_output');
  });

  it('should change output table sort order when column headers are clicked', async () => {
    setupOutputTableTest();

    const table = await screen.findByRole('table');
    const rows = within(table).queryAllByRole('row');
    const headers = within(rows[0]).queryAllByRole('columnheader');
    const cells1 = within(rows[1]).queryAllByRole('cell');
    const cells2 = within(rows[2]).queryAllByRole('cell');

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('file_output');
    within(cells1[2]).getByText('File');
    within(cells1[3]).getByDisplayValue('target_workflow_1_file_output');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('unused_output');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByDisplayValue('');

    // sort ascending by column 1
    await act(async () => {
      await fireEvent.click(within(headers[1]).getByRole('button'));
    });

    within(cells1[0]).getByText('target_workflow_1');
    within(cells1[1]).getByText('file_output');
    within(cells1[2]).getByText('File');
    within(cells1[3]).getByDisplayValue('target_workflow_1_file_output');

    within(cells2[0]).getByText('target_workflow_1');
    within(cells2[1]).getByText('unused_output');
    within(cells2[2]).getByText('String');
    within(cells2[3]).getByDisplayValue('');

    // sort descending by column 1
    await act(async () => {
      await fireEvent.click(within(headers[1]).getByRole('button'));
    });

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
