import { screen, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { useWorkflowsStatus, WorkflowsStatus } from 'src/workflows-app/status/workflows-status';
import { WorkflowsTroubleshooter } from 'src/workflows-app/status/WorkflowsTroubleshooter';

type WorkflowsStatusExports = typeof import('./workflows-status');
jest.mock('./workflows-status', (): WorkflowsStatusExports => {
  return {
    useWorkflowsStatus: jest.fn(),
  };
});

type TroubleshooterRow = {
  label: string;
  content: string;
  icon: string;
};
const extractRow = (cells: HTMLElement[]): TroubleshooterRow => {
  const label: string = cells.at(1)!.textContent!.trim();
  const content: string = cells.at(2)!.textContent!.trim();

  const iconCell = cells.at(0)!;
  let icon: string;
  if (within(iconCell).queryAllByLabelText('Validation Success').length > 0) {
    icon = 'CHECK';
  } else if (within(iconCell).queryAllByLabelText('Validation Running').length > 0) {
    icon = 'SPINNER';
  } else if (within(iconCell).queryAllByLabelText('Validation Failure').length > 0) {
    icon = 'ERROR';
  } else {
    throw new Error('Unknown icon');
  }

  return { label, content, icon };
};

const noDataYetStatus: WorkflowsStatus = {
  cbasCromwellConnection: null,
  cbasEcmConnection: null,
  cbasLeonardoConnection: null,
  cbasProxyUrl: null,
  cbasResponsive: null,
  cbasSamConnection: null,
  cromwellReaderDatabaseConnection: null,
  cromwellReaderProxyUrl: null,
  cromwellReaderResponsive: null,
  cromwellRunnerAppName: null,
  cromwellRunnerAppStatus: null,
  cromwellRunnerDatabaseConnection: null,
  cromwellRunnerProxyUrl: null,
  cromwellRunnerResponsive: null,
  totalVisibleApps: null,
  workflowsAppName: null,
  workflowsAppStatus: null,
};

const textStatusFields = {
  totalVisibleApps: 'Total apps visible',
  workflowsAppName: 'Workflows app name',
  workflowsAppStatus: 'Workflows app status',
  cromwellRunnerAppName: 'Cromwell runner app name',
  cromwellRunnerAppStatus: 'Cromwell runner app status',
  cbasProxyUrl: 'CBAS proxy url',
  cromwellReaderProxyUrl: 'Cromwell reader proxy url',
  cromwellRunnerProxyUrl: 'Cromwell runner proxy url',
};

const booleanStatusFields = {
  cbasResponsive: 'CBAS responsive',
  cbasCromwellConnection: 'CBAS / Cromwell link',
  cbasEcmConnection: 'CBAS / ECM link',
  cbasSamConnection: 'CBAS / SAM link',
  cbasLeonardoConnection: 'CBAS / Leonardo link',
  cromwellReaderResponsive: 'Cromwell reader responsive',
  cromwellReaderDatabaseConnection: 'Cromwell reader database',
  cromwellRunnerResponsive: 'Cromwell runner responsive',
  cromwellRunnerDatabaseConnection: 'Cromwell runner database',
};

const noDataYetExpectation: TroubleshooterRow[] = [
  {
    label: 'Workspace Id',
    content: 'test-workspace',
    icon: 'CHECK',
  },
  {
    label: 'Tenant Id',
    content: 'test-tenant',
    icon: 'CHECK',
  },
  {
    label: 'Subscription Id',
    content: 'test-subscription',
    icon: 'CHECK',
  },
  {
    label: 'Resource Group Id',
    content: 'test-mrg',
    icon: 'CHECK',
  },
  {
    label: 'Total apps visible',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Workflows app name',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Workflows app status',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Cromwell runner app name',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Cromwell runner app status',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'CBAS proxy url',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Cromwell reader proxy url',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Cromwell runner proxy url',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'CBAS responsive',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'CBAS / Cromwell link',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'CBAS / ECM link',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'CBAS / SAM link',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'CBAS / Leonardo link',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Cromwell reader responsive',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Cromwell reader database',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Cromwell runner responsive',
    content: '',
    icon: 'SPINNER',
  },
  {
    label: 'Cromwell runner database',
    content: '',
    icon: 'SPINNER',
  },
].sort();

const updatedUninitializedTroubleshooterRows = (label: string, content: string, icon: string) => {
  const expectedRows = [...noDataYetExpectation];
  const indexToReplace = expectedRows.findIndex((row) => row.label === label);
  expectedRows[indexToReplace] = { label, content, icon };
  return expectedRows;
};

const renderPageAndValidateRows: (status: WorkflowsStatus, expectedRows: TroubleshooterRow[]) => void = (
  status: WorkflowsStatus,
  expectedRows: TroubleshooterRow[]
) => {
  asMockedFn(useWorkflowsStatus).mockReturnValue({
    status,
    refreshStatus: jest.fn(),
  });

  render(
    h(WorkflowsTroubleshooter, {
      workspaceId: 'test-workspace',
      mrgId: 'test-mrg',
      tenantId: 'test-tenant',
      subscriptionId: 'test-subscription',
      onDismiss: jest.fn(),
    })
  );

  const tableRows = screen.getAllByRole('row');
  const statusLabelAndValueCells = tableRows.map((row) => {
    const cells = within(row).getAllByRole('cell');
    return extractRow(cells);
  });

  expect(statusLabelAndValueCells.sort()).toEqual(expectedRows.sort());
};

describe('WorkflowsTroubleshooter', () => {
  it('renders null (non-initialized) values as empty with spinner icon', () => {
    renderPageAndValidateRows(noDataYetStatus, noDataYetExpectation);
  });

  Object.entries(textStatusFields).forEach(([field, label]) => {
    it(`renders text value ${label} as ${field}`, () => {
      const testStatus: WorkflowsStatus = { ...noDataYetStatus };
      testStatus[field] = 'test-value';

      const expectedRows = updatedUninitializedTroubleshooterRows(label, 'test-value', 'CHECK');

      renderPageAndValidateRows(testStatus, expectedRows);
    });
  });

  Object.entries(booleanStatusFields).forEach(([field, label]) => {
    it(`renders successful ${field} status in ${label}`, () => {
      const testStatus: WorkflowsStatus = { ...noDataYetStatus };
      testStatus[field] = 'true';

      const expectedRows = updatedUninitializedTroubleshooterRows(label, 'true', 'CHECK');

      renderPageAndValidateRows(testStatus, expectedRows);
    });

    it(`renders unsuccessful ${label} status in ${field}`, () => {
      const testStatus: WorkflowsStatus = { ...noDataYetStatus };
      testStatus[field] = 'false';

      const expectedRows = updatedUninitializedTroubleshooterRows(label, 'false', 'ERROR');

      renderPageAndValidateRows(testStatus, expectedRows);
    });
  });
});
