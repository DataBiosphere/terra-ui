import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import selectEvent from 'react-select-event';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { Ajax } from 'src/libs/ajax';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { getConfig } from 'src/libs/config';
import { getUser } from 'src/libs/state';
import { BaseSubmissionHistory } from 'src/workflows-app/pages/SubmissionHistory';
import { mockAbortResponse, mockAzureWorkspace } from 'src/workflows-app/utils/mock-responses';

// Necessary to mock the AJAX module.
jest.mock('src/libs/ajax');
jest.mock('src/libs/notifications.js');
jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}));
jest.mock('src/components/PopupTrigger', () => {
  const originalModule = jest.requireActual('src/components/PopupTrigger');
  return {
    ...originalModule,
    MenuTrigger: jest.fn(),
  };
});
jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getUser: jest.fn(),
}));
// Mocking feature preview setup
jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));
jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

// SubmissionHistory component uses AutoSizer to determine the right size for table to be displayed. As a result we need to
// mock out the height and width so that when AutoSizer asks for the width and height of "browser" it can use the mocked
// values and render the component properly. Without this the tests will be break.
// (see https://github.com/bvaughn/react-virtualized/issues/493 and https://stackoverflow.com/a/62214834)
const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

const runSetData = {
  run_sets: [
    {
      error_count: 0,
      submission_timestamp: '2022-01-01T12:00:00.000+00:00',
      last_modified_timestamp: '2022-01-02T13:01:01.000+00:00',
      record_type: 'FOO',
      run_count: 1,
      run_set_id: 'ea001565-1cd6-4e43-b446-932ac1918081',
      state: 'COMPLETE',
    },
    {
      error_count: 1,
      submission_timestamp: '2021-07-10T12:00:00.000+00:00',
      last_modified_timestamp: '2021-08-11T13:01:01.000+00:00',
      record_type: 'FOO',
      run_count: 2,
      run_set_id: 'b7234aae-6f43-405e-bb3a-71f924e09825',
      state: 'ERROR',
    },
  ],
};

const mockAppResponse = [
  {
    workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
    cloudContext: {
      cloudProvider: 'AZURE',
    },
    status: 'RUNNING',
    proxyUrls: {
      cbas: 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cbas',
      'cbas-ui': 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/',
      cromwell: 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cromwell',
    },
    appName: 'terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374',
    appType: 'CROMWELL',
    auditInfo: {
      creator: 'abc@gmail.com',
    },
  },
  {
    workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
    cloudContext: {
      cloudProvider: 'AZURE',
    },
    status: 'RUNNING',
    proxyUrls: {
      wds: 'https://abc.servicebus.windows.net/wds-79201ea6-519a-4077-a9a4-75b2a7c4cdeb-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/',
    },
    appName: 'wds-79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
    appType: 'WDS',
    auditInfo: {
      creator: 'abc@gmail.com',
    },
  },
];

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
});

let container = null;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  // setup a DOM element as a render target
  container = document.createElement('div');
  document.body.appendChild(container);
  MenuTrigger.mockImplementation(({ content }) => {
    return div({ role: 'menu' }, [content]);
  });
  getConfig.mockReturnValue({ wdsUrlRoot: 'http://localhost:3000/wds', cbasUrlRoot: 'http://localhost:8080/cbas' });
});

afterEach(() => {
  jest.clearAllMocks();
  // cleanup on exiting
  container.remove();
  container = null;
});

afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
});

// Note: Since the timestamps in the data is being converted to Local timezone, it returns different time when the tests
//       are run locally and in GitHub action. Hence everywhere in this file we are verifying only the date format for now.
describe('SubmissionHistory page', () => {
  const headerPosition = {
    Actions: 0,
    Submission: 1,
    Status: 2,
    'Date Submitted': 3,
    Duration: 4,
    Comment: 5,
  };

  it('should display no content message when there are no previous run sets', async () => {
    // Arrange
    const mockRunSetResponse = jest.fn(() => Promise.resolve([]));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));

    getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            get: jest.fn(mockRunSetResponse),
          },
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionHistory, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });

    // Assert
    await waitFor(() => {
      expect(mockRunSetResponse).toBeCalledTimes(1);
    });

    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-colcount', '6');
    expect(table).toHaveAttribute('aria-rowcount', '1');

    const rows = within(table).queryAllByRole('cell');
    within(rows[1]).findByText('Nothing here yet! Your previously run submissions will be displayed here.');
  });

  it('should correctly display previous 2 run sets', async () => {
    const getRunSetsMethod = jest.fn(() => Promise.resolve(runSetData));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));

    getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            get: jest.fn(getRunSetsMethod),
          },
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionHistory, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');

    // Assert
    expect(table).toHaveAttribute('aria-colcount', '6');
    expect(table).toHaveAttribute('aria-rowcount', '3');

    const rows = within(table).queryAllByRole('row');
    expect(rows.length).toBe(3);

    const headers = within(rows[0]).queryAllByRole('columnheader');
    expect(headers.length).toBe(6);
    within(headers[headerPosition.Actions]).getByText('Actions');
    within(headers[headerPosition.Submission]).getByText('Submission name');
    within(headers[headerPosition.Status]).getByText('Status');
    within(headers[headerPosition['Date Submitted']]).getByText('Date Submitted');
    within(headers[headerPosition.Duration]).getByText('Duration');
    within(headers[headerPosition.Comment]).getByText('Comment');

    // check data rows are rendered as expected
    const cellsFromDataRow1 = within(rows[1]).queryAllByRole('cell');
    expect(cellsFromDataRow1.length).toBe(6);
    within(headers[headerPosition.Actions]).getByText('Actions');
    within(cellsFromDataRow1[headerPosition.Submission]).getByText('Data used: FOO');
    within(cellsFromDataRow1[headerPosition.Submission]).getByText('1 workflows');
    within(cellsFromDataRow1[headerPosition.Status]).getByText('Success');
    within(cellsFromDataRow1[headerPosition['Date Submitted']]).getByText(/Jan 1, 2022/);
    within(cellsFromDataRow1[headerPosition.Duration]).getByText('1 day 1 hour 1 minute 1 second');

    const cellsFromDataRow2 = within(rows[2]).queryAllByRole('cell');
    expect(cellsFromDataRow2.length).toBe(6);
    within(headers[headerPosition.Actions]).getByText('Actions');
    within(cellsFromDataRow2[headerPosition.Submission]).getByText('Data used: FOO');
    within(cellsFromDataRow2[headerPosition.Status]).getByText('Failed with 1 errors');
    within(cellsFromDataRow2[headerPosition['Date Submitted']]).getByText(/Jul 10, 2021/);
    within(cellsFromDataRow2[headerPosition.Duration]).getByText('1 month 1 day 1 hour 1 minute 1 second');
  });

  it('should support canceled and canceling submissions', async () => {
    jest.clearAllMocks();
    const runSetData = {
      run_sets: [
        {
          error_count: 0,
          submission_timestamp: '2022-01-01T12:00:00.000+00:00',
          last_modified_timestamp: '2022-01-02T13:01:01.000+00:00',
          record_type: 'FOO',
          run_count: 1,
          run_set_id: 'ea001565-1cd6-4e43-b446-932ac1918081',
          state: 'CANCELED',
        },
        {
          error_count: 0,
          submission_timestamp: '2021-07-10T12:00:00.000+00:00',
          last_modified_timestamp: '2021-08-11T13:01:01.000+00:00',
          record_type: 'FOO',
          run_count: 2,
          run_set_id: 'b7234aae-6f43-405e-bb3a-71f924e09825',
          state: 'CANCELING',
        },
      ],
    };

    const getRunSetsMethod = jest.fn(() => Promise.resolve(runSetData));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));

    getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            get: jest.fn(getRunSetsMethod),
          },
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionHistory, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');

    // Assert
    expect(table).toHaveAttribute('aria-colcount', '6');
    expect(table).toHaveAttribute('aria-rowcount', '3');

    const rows = within(table).queryAllByRole('row');
    expect(rows.length).toBe(3);

    // check data rows are rendered as expected
    const cellsFromDataRow1 = within(rows[1]).queryAllByRole('cell');
    within(cellsFromDataRow1[headerPosition.Status]).getByText('Canceled');

    const cellsFromDataRow2 = within(rows[2]).queryAllByRole('cell');
    within(cellsFromDataRow2[headerPosition.Status]).getByText('Canceling');
  });

  it('should sort columns properly', async () => {
    const user = userEvent.setup();
    const getRunSetsMethod = jest.fn(() => Promise.resolve(runSetData));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));

    getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            get: jest.fn(getRunSetsMethod),
          },
        },
      };
    });

    // Act
    await act(async () => {
      await render(
        h(BaseSubmissionHistory, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const table = await screen.getByRole('table');

    const rows = within(table).queryAllByRole('row');
    expect(rows.length).toBe(3);

    const headers = within(rows[0]).queryAllByRole('columnheader');
    expect(headers.length).toBe(6);

    const topRowCells = (column) => {
      const topRowCells = within(rows[1]).queryAllByRole('cell');
      return topRowCells[column];
    };
    // Click on "Date Submitted" column and check that the top column is correct for:
    // * ascending order
    await user.click(within(headers[headerPosition['Date Submitted']]).getByRole('button'));
    within(topRowCells(headerPosition['Date Submitted'])).getByText(/Jul 10, 2021/);

    // * descending order
    await user.click(within(headers[headerPosition['Date Submitted']]).getByRole('button'));
    within(topRowCells(headerPosition['Date Submitted'])).getByText(/Jan 1, 2022/);

    // Click on "Status" column and check that the top column is correct for:
    // * ascending order
    await user.click(within(headers[headerPosition.Status]).getByRole('button'));
    within(topRowCells(headerPosition.Status)).getByText('Success');

    // * descending order
    await user.click(within(headers[headerPosition.Status]).getByRole('button'));
    within(topRowCells(headerPosition.Status)).getByText('Failed with 1 errors');

    // Click on "Duration" column and check that the top column is correct for:
    // * ascending order
    await user.click(within(headers[headerPosition.Duration]).getByRole('button'));
    within(topRowCells(headerPosition.Duration)).getByText('1 day 1 hour 1 minute 1 second');

    // * descending order
    await user.click(within(headers[headerPosition.Duration]).getByRole('button'));
    within(topRowCells(headerPosition.Duration)).getByText('1 month 1 day 1 hour 1 minute 1 second');
  });

  const simpleRunSetData = {
    run_sets: [
      {
        error_count: 0,
        submission_timestamp: '2022-01-01T12:00:00.000+00:00',
        last_modified_timestamp: '2022-01-02T13:01:01.000+00:00',
        record_type: 'FOO',
        run_count: 1,
        run_set_id: '20000000-0000-0000-0000-200000000002',
        state: 'RUNNING',
      },
    ],
    fully_updated: true,
  };

  it('should indicate fully updated polls', async () => {
    jest.clearAllMocks();
    const runSetData = simpleRunSetData;

    const getRunSetsMethod = jest.fn(() => Promise.resolve(runSetData));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));

    getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            get: jest.fn(getRunSetsMethod),
          },
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionHistory, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(screen.getByText('Submission statuses are all up to date.')).toBeInTheDocument();
  });

  it('should indicate incompletely updated polls', async () => {
    jest.clearAllMocks();
    const runSetData = _.merge(simpleRunSetData, { fully_updated: false });

    const getRunSetsMethod = jest.fn(() => Promise.resolve(runSetData));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));

    getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            get: jest.fn(getRunSetsMethod),
          },
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionHistory, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(screen.getByText('Some submission statuses are not up to date. Refreshing the page may update more statuses.')).toBeInTheDocument();
  });

  it('Gives abort option for actions button', async () => {
    const getRunSetsMethod = jest.fn(() => Promise.resolve(runSetData));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));

    getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            get: jest.fn(getRunSetsMethod),
          },
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionHistory, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');

    const rows = within(table).queryAllByRole('row');
    const headers = within(rows[0]).queryAllByRole('columnheader');
    expect(headers.length).toBe(6);

    const cellsFromDataRow1 = within(rows[1]).queryAllByRole('cell');

    await act(async () => {
      const actionsMenu = within(cellsFromDataRow1[0]).getByRole('button');
      await selectEvent.openMenu(actionsMenu);
      expect(actionsMenu).toHaveTextContent('Abort');
    });
  });

  it('should abort successfully', async () => {
    const user = userEvent.setup();
    const runSetData = simpleRunSetData;
    const getRunSetsMethod = jest.fn(() => Promise.resolve(runSetData));
    const mockListAppsFn = jest.fn(() => Promise.resolve(mockAppResponse));
    const cancelSubmissionFunction = jest.fn(() => Promise.resolve(mockAbortResponse));

    getUser.mockReturnValue({
      email: 'abc@gmail.com',
    });

    await Apps.mockImplementation(() => {
      return {
        listAppsV2: jest.fn(mockListAppsFn),
      };
    });

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            get: jest.fn(getRunSetsMethod),
            cancel: jest.fn(cancelSubmissionFunction),
          },
        },
      };
    });

    // Act
    await act(async () => {
      render(
        h(BaseSubmissionHistory, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        }),
        container
      );
    });

    // Assert
    await waitFor(() => {
      expect(getRunSetsMethod).toBeCalledTimes(1);
    });

    expect(screen.getByRole('table')).toBeInTheDocument();

    const table = screen.getByRole('table');

    const rows = within(table).queryAllByRole('row');
    const headers = within(rows[0]).queryAllByRole('columnheader');
    expect(headers.length).toBe(6);

    const cellsFromDataRow1 = within(rows[1]).queryAllByRole('cell');
    const actionsMenu = within(cellsFromDataRow1[0]).getByRole('button');

    await act(async () => {
      await selectEvent.openMenu(actionsMenu);
      expect(actionsMenu).toHaveTextContent('Abort');
    });

    const abortButton = screen.getByText('Abort');
    expect(abortButton).toHaveAttribute('aria-disabled', 'false');
    await user.click(abortButton);

    expect(cancelSubmissionFunction).toHaveBeenCalled();
    expect(cancelSubmissionFunction).toBeCalledWith(
      'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cbas',
      '20000000-0000-0000-0000-200000000002'
    );
  });
});
