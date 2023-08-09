import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_CROMWELL_APP_CALL_CACHING } from 'src/libs/feature-previews-config';
import * as Nav from 'src/libs/nav';
import { AppProxyUrlStatus, getUser, workflowsAppStore } from 'src/libs/state';
import { SelectHelper } from 'src/testing/test-utils';
import { BaseSubmissionConfig } from 'src/workflows-app/SubmissionConfig';
import {
  badRecordTypeRunSetResponse,
  methodsResponse,
  mockAzureApps,
  mockAzureWorkspace,
  myStructInput,
  runSetInputDef,
  runSetOutputDef,
  runSetOutputDefWithDefaults,
  runSetResponse,
  runSetResponseWithStruct,
  searchResponses,
  typesResponse,
  undefinedRecordTypeRunSetResponse,
} from 'src/workflows-app/utils/mock-responses';

jest.mock('src/libs/ajax');

jest.mock('src/libs/notifications.js');

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}));

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getUser: jest.fn(),
}));

jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

jest.mock('src/libs/ajax/metrics/useMetrics', () => ({
  ...jest.requireActual('src/libs/ajax/metrics/useMetrics'),
  useMetricsEvent: jest.fn(() => ({ captureEvent: jest.fn() })),
}));

jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

// SubmissionConfig component uses AutoSizer to determine the right size for table to be displayed. As a result we need to
// mock out the height and width so that when AutoSizer asks for the width and height of "browser" it can use the mocked
// values and render the component properly. Without this the tests will be break.
// (see https://github.com/bvaughn/react-virtualized/issues/493 and https://stackoverflow.com/a/62214834)
const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

const leoUrlRoot = 'https://leonardo.mock.org/';
const wdsUrlRoot = 'https://lz-abc/wds-abc-c07807929cd1/';
const cbasUrlRoot = 'https://lz-abc/terra-app-abc/cbas';
const cromwellUrlRoot = 'https://lz-abc/terra-app-abc/cromwell';

describe('BaseSubmissionConfig renders workflow details', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  beforeEach(() => {
    getConfig.mockReturnValue({ wdsUrlRoot, cbasUrlRoot, cromwellUrlRoot });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  it('should render workflow details', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);
    expect(mockLeoResponse).toHaveBeenCalledTimes(0);

    expect(screen.getByText('Submission Configuration for Target Workflow 1')).toBeInTheDocument();
    expect(screen.getByText('Workflow Version:')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();

    expect(screen.getByText('Workflow source URL:')).toBeInTheDocument();
    expect(
      screen.getByText('https://raw.githubusercontent.com/DataBiosphere/cbas/main/useful_workflows/target_workflow_1/target_workflow_1.wdl')
    ).toBeInTheDocument();

    expect(screen.getByText('Select a data table:')).toBeInTheDocument();
    expect(screen.getByText('FOO')).toBeInTheDocument();

    const workflowScriptLink = screen.getByRole('button', { name: 'View Workflow Script' });
    expect(workflowScriptLink).toBeInTheDocument();
    expect(workflowScriptLink.getAttribute('aria-disabled')).toBe('false');

    // check helpful links box is rendered
    // note: only 1 link will show up as the workflow rendered is not a Covid-19 workflow
    expect(screen.getByText('Have questions?')).toBeInTheDocument();
    expect(screen.getByText('How to set up and run a workflow')).toBeInTheDocument();

    // ** ACT **
    // user clicks on View Workflow Script to open the modal
    await user.click(workflowScriptLink);

    // ** ASSERT **
    // verify that modal was rendered on screen
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Workflow Script')).toBeInTheDocument();
  });

  it('should render a functional call cache toggle button', async () => {
    isFeaturePreviewEnabled.mockImplementation((id) => (id === ENABLE_CROMWELL_APP_CALL_CACHING ? true : isFeaturePreviewEnabled(id)));
    const { container } = await act(async () => {
      return render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });
    expect(await axe(container)).toHaveNoViolations();
    const user = userEvent.setup();
    const callCacheToggleButton = screen.getByLabelText('Call Caching:');
    expect(callCacheToggleButton).toBeDefined(); // Switch exists
    expect(screen.getByText('Call Caching:')).toBeVisible(); // Label text exists and is visible
    expect(callCacheToggleButton).toHaveProperty('checked', true); // Switch defaults to true
    await user.click(callCacheToggleButton);
    expect(callCacheToggleButton).toHaveProperty('checked', false); // Clicking the switch toggles it
    await user.click(callCacheToggleButton);
    expect(callCacheToggleButton).toHaveProperty('checked', true); // Clicking switch again toggles it back.
  });

  it('should not render call cache toggle with disabled feature flag', async () => {
    isFeaturePreviewEnabled.mockImplementation((id) => (id === ENABLE_CROMWELL_APP_CALL_CACHING ? false : isFeaturePreviewEnabled(id)));
    const { container } = await act(async () => {
      return render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      );
    });
    expect(await axe(container)).toHaveNoViolations();
    const toggleButton = screen.queryByLabelText('Call Caching:');
    expect(toggleButton).not.toBeInTheDocument();
  });

  it('should render a back to workflows button', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);
    expect(mockLeoResponse).toHaveBeenCalledTimes(0);

    const backButton = screen.getByText('Back to workflows');

    // ** ACT **
    // user clicks on back button
    await user.click(backButton);

    expect(Nav.goToPath).toHaveBeenCalledWith('workspace-workflows-app', {
      name: 'test-azure-ws-name',
      namespace: 'test-azure-ws-namespace',
      workspace: { workspace: { workspaceId: 'abc-c07807929cd1' } },
    });
  });
});

describe('BaseSubmissionConfig with workflowsAppStore', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  beforeEach(() => {
    getConfig.mockReturnValue({ leoUrlRoot });
    getUser.mockReturnValue({ email: 'groot@gmail.com' });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  it("should call Leo to get proxy urls if they aren't set in workflowsAppStore", async () => {
    // ** ARRANGE **
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
      };
    });

    workflowsAppStore.set({
      workspaceId: undefined,
      wdsProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
      cbasProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
      cromwellProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);
    expect(mockLeoResponse).toHaveBeenCalledTimes(1);

    // assert that when the proxy urls were extracted they were also set in the workflowsAppStore
    expect(workflowsAppStore.get().workspaceId).toStrictEqual(mockAzureWorkspace.workspace.workspaceId);
    expect(workflowsAppStore.get().wdsProxyUrlState).toStrictEqual({
      status: AppProxyUrlStatus.Ready,
      state: 'https://lz-abc/wds-abc-c07807929cd1/',
    });
    expect(workflowsAppStore.get().cbasProxyUrlState).toStrictEqual({ status: AppProxyUrlStatus.Ready, state: 'https://lz-abc/terra-app-abc/cbas' });
    expect(workflowsAppStore.get().cromwellProxyUrlState).toStrictEqual({
      status: AppProxyUrlStatus.Ready,
      state: 'https://lz-abc/terra-app-abc/cromwell',
    });
  });

  it("shouldn't call Leo to get proxy urls if they are already set in workflowsAppStore", async () => {
    // ** ARRANGE **
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
      };
    });

    workflowsAppStore.set({
      workspaceId: 'abc-c07807929cd1',
      wdsProxyUrlState: { status: AppProxyUrlStatus.Ready, state: 'https://lz-abc/wds-abc-c07807929cd1/' },
      cbasProxyUrlState: { status: AppProxyUrlStatus.Ready, state: 'https://lz-abc/terra-app-abc/cbas' },
      cromwellProxyUrlState: { status: AppProxyUrlStatus.Ready, state: 'https://lz-abc/terra-app-abc/cromwell' },
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);
    // Leo is not called since proxy urls were already ready in workflowsAppStore
    expect(mockLeoResponse).toHaveBeenCalledTimes(0);
  });

  it('should call Leo to get proxy url for WDS if its not ready', async () => {
    // ** ARRANGE **
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn(() => Promise.resolve(searchResponses.FOO));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockAzureApps));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
        Apps: {
          listAppsV2: mockLeoResponse,
        },
      };
    });

    workflowsAppStore.set({
      workspaceId: 'abc-c07807929cd1',
      wdsProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
      cbasProxyUrlState: { status: AppProxyUrlStatus.Ready, state: 'https://lz-abc/terra-app-abc/cbas' },
      cromwellProxyUrlState: { status: AppProxyUrlStatus.Ready, state: 'https://lz-abc/terra-app-abc/cromwell' },
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);
    // Leo is called since proxy urls for WDS is not available yet
    expect(mockLeoResponse).toHaveBeenCalledTimes(1);

    // verify that 'wdsProxyUrlState' in store was updated
    expect(workflowsAppStore.get().wdsProxyUrlState).toStrictEqual({
      status: AppProxyUrlStatus.Ready,
      state: 'https://lz-abc/wds-abc-c07807929cd1/',
    });
  });
});

describe('Initial state', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  beforeEach(() => {
    getConfig.mockReturnValue({ wdsUrlRoot, cbasUrlRoot });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  it('should initially populate the record selector with records determined by the previously executed run set', async () => {
    // ** ARRANGE **
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);

    const table = screen.getByRole('table');

    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBe(5);

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(4);

    const cells = within(rows[1]).getAllByRole('cell');
    expect(cells.length).toBe(4);
  });

  it('should initially populate the inputs definition table with attributes determined by the previously executed run set', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);

    const button = screen.getByRole('button', { name: 'Inputs' });

    // ** ACT **
    await user.click(button);

    // ** ASSERT **
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    expect(rows.length).toBe(runSetInputDef.length + 1); // one row for each input definition variable, plus headers

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(5);

    const cellsFoo = within(rows[1]).getAllByRole('cell');
    expect(cellsFoo.length).toBe(5);
    within(cellsFoo[0]).getByText('foo');
    within(cellsFoo[1]).getByText('foo_rating_workflow_var');
    within(cellsFoo[2]).getByText('Int');
    within(cellsFoo[3]).getByText('Fetch from Data Table');
    within(cellsFoo[4]).getByText('foo_rating');

    const cellsBar = within(rows[2]).getAllByRole('cell');
    expect(cellsBar.length).toBe(5);
    expect(cellsBar[0].textContent).toBe('target_workflow_1');
    within(cellsBar[1]).getByText('bar_string_workflow_var');
    within(cellsBar[2]).getByText('String');
    within(cellsBar[3]).getByText('Fetch from Data Table');
    within(cellsBar[4]).getByText('bar_string');

    const thirdInputRow = within(rows[3]).getAllByRole('cell');
    expect(thirdInputRow.length).toBe(5);
    expect(thirdInputRow[0].textContent).toBe('target_workflow_1');
    within(thirdInputRow[1]).getByText('optional_var');
    within(thirdInputRow[2]).getByText('String');
    within(thirdInputRow[3]).getByText('Type a Value');
    within(thirdInputRow[4]).getByDisplayValue('Hello World');
  });

  it('should initially populate the outputs definition table with attributes determined by the previously executed run set', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);

    const button = screen.getByRole('button', { name: 'Outputs' });

    // ** ACT **
    await user.click(button);

    // ** ASSERT **
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    expect(runSetOutputDef.length).toBe(2);
    expect(rows.length).toBe(runSetOutputDef.length + 1); // one row for each output definition variable, plus headers

    const headers = within(rows[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(4);

    const row1cells = within(rows[1]).getAllByRole('cell');
    expect(row1cells.length).toBe(4);
    expect(row1cells[0].textContent).toBe('target_workflow_1');
    within(row1cells[1]).getByText('file_output');
    within(row1cells[2]).getByText('File');
    within(row1cells[3]).getByDisplayValue('target_workflow_1_file_output');

    const row2cells = within(rows[2]).getAllByRole('cell');
    expect(row2cells.length).toBe(4);
    expect(row2cells[0].textContent).toBe('target_workflow_1');
    within(row2cells[1]).getByText('unused_output');
    within(row2cells[2]).getByText('String');
    within(row2cells[3]).getByDisplayValue('');
  });
});

describe('Records Table updates', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  beforeEach(() => {
    getConfig.mockReturnValue({ wdsUrlRoot, cbasUrlRoot });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  it('should repopulate the record selector when the dropdown selection changes', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);
    const table = screen.getByRole('table');

    // ** ACT **
    const dropdown = screen.getByLabelText('Select a data table');
    const dropdownSelect = new SelectHelper(dropdown, user);
    await dropdownSelect.selectOption('BAR');

    // ** ASSERT **
    // selecting a dropdown option should trigger a re-render, and a second call to records data
    expect(mockSearchResponse).toHaveBeenCalledTimes(2);
    const rowsBAR = within(table).getAllByRole('row');
    expect(rowsBAR.length).toBe(3);
    const headers = within(rowsBAR[0]).getAllByRole('columnheader');
    expect(headers.length).toBe(4);
    const cells = within(rowsBAR[1]).getAllByRole('cell');
    expect(cells.length).toBe(4);

    // ** ACT **
    await dropdownSelect.selectOption('FOO');

    // ** ASSERT **
    // selecting a dropdown option should (again) trigger a re-render, and a third call to records data
    expect(mockSearchResponse).toHaveBeenCalledTimes(3);
    const rowsFOO = within(table).getAllByRole('row');
    expect(rowsFOO.length).toBe(5);
  });

  it('should resize the columns and new widths should be preserved when data table selection changes within given workflow', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);
    const table = screen.getByRole('table');

    const fooRows1 = within(table).getAllByRole('row');
    expect(fooRows1.length).toBe(5);

    const fooHeaders1 = within(fooRows1[0]).getAllByRole('columnheader');
    expect(fooHeaders1.length).toBe(4);
    within(fooHeaders1[1]).getByText('ID');
    expect(getComputedStyle(fooHeaders1[1]).width).toBe('300px'); // initial column width

    // ** ACT **
    // simulate user resizing the column 'ID' for data table 'FOO'
    const fooDraggableIcon = fooHeaders1[1].querySelector("[data-icon='columnGrabber']");
    fireEvent.mouseDown(fooDraggableIcon);
    fireEvent.mouseMove(fooDraggableIcon, { clientX: 200, clientY: 0 }); // user moves the icon 200px to right
    fireEvent.mouseUp(fooDraggableIcon);

    // ** ASSERT **
    // new width of column 'ID' for data table 'FOO' should be 500
    expect(getComputedStyle(fooHeaders1[1]).width).toBe('500px');

    // ** ACT **
    // Change Data Table to 'BAR'
    const dropdown = screen.getByLabelText('Select a data table');
    const dropdownSelect = new SelectHelper(dropdown, user);
    await dropdownSelect.selectOption('BAR');

    // ** ASSERT **
    const barRows = within(table).getAllByRole('row');
    expect(barRows.length).toBe(3);
    const barHeaders = within(barRows[0]).getAllByRole('columnheader');
    expect(barHeaders.length).toBe(4);
    within(barHeaders[1]).getByText('ID');
    // even though both 'FOO' and 'BAR' data tables have 'ID' columns their widths can be different
    expect(getComputedStyle(barHeaders[1]).width).toBe('300px'); // initial column width

    // ** ACT **
    // simulate user resizing the column 'ID' for data table 'BAR'
    const barDraggableIcon = barHeaders[1].querySelector("[data-icon='columnGrabber']");
    fireEvent.mouseDown(barDraggableIcon);
    fireEvent.mouseMove(barDraggableIcon, { clientX: 50, clientY: 0 }); // user moves the icon 50px to right
    fireEvent.mouseUp(barDraggableIcon);

    // ** ASSERT **
    // new width of column 'ID' for data table 'BAR' should be 350
    expect(getComputedStyle(barHeaders[1]).width).toBe('350px');

    // ** ACT **
    // Change Data Table back to 'FOO'
    await dropdownSelect.selectOption('FOO');

    // ** ASSERT **
    // verify that the width of column 'ID' has been preserved from previous resizing
    const fooRows2 = within(table).getAllByRole('row');
    const fooHeaders2 = within(fooRows2[0]).getAllByRole('columnheader');
    expect(getComputedStyle(fooHeaders2[1]).width).toBe('500px');
  });

  it('when records are selected, should display modal when Submit button is clicked', async () => {
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);

    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[1];
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    const button = screen.getByLabelText('Submit button');
    await user.click(button);
    screen.getByText('Send submission');
  });

  it('clear selected records when data type is changed', async () => {
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);

    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[1];
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    const button = screen.getByLabelText('Submit button');
    expect(button).toHaveAttribute('aria-disabled', 'false');
    expect(button).not.toHaveAttribute('disabled');
    expect(screen.queryByText('No records selected')).toBeNull();

    // Change the selected data types
    const dropdown = screen.getByLabelText('Select a data table');
    const dropdownSelect = new SelectHelper(dropdown, user);
    await dropdownSelect.selectOption('BAR');

    const checkboxesAfterRecordTypeChange = screen.getAllByRole('checkbox');
    for (const checkboxAfterRecordTypeChange of checkboxesAfterRecordTypeChange) {
      expect(checkboxAfterRecordTypeChange).not.toBeChecked();
    }

    const buttonAfterRecordTypeChange = screen.getByLabelText('Submit button');
    expect(buttonAfterRecordTypeChange).toHaveAttribute('aria-disabled', 'true');
    expect(buttonAfterRecordTypeChange).toHaveAttribute('disabled');
    screen.getByText('No records selected');

    // Change the selected data type back
    await dropdownSelect.selectOption('FOO');

    const checkboxesAfterRecordTypeChange2 = screen.getAllByRole('checkbox');
    for (const checkboxAfterRecordTypeChange of checkboxesAfterRecordTypeChange2) {
      expect(checkboxAfterRecordTypeChange).not.toBeChecked();
    }

    const buttonAfterRecordTypeChange2 = screen.getByLabelText('Submit button');
    // Still no records selected, so this all should still be true:
    expect(buttonAfterRecordTypeChange2).toHaveAttribute('aria-disabled', 'true');
    expect(buttonAfterRecordTypeChange2).toHaveAttribute('disabled');
    screen.getByText('No records selected');
  });

  it('should display error message when WDS is unable to find a record type', async () => {
    const mockRunSetResponse = jest.fn(() => Promise.resolve(badRecordTypeRunSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    screen.getByText(/Data table not found: BADFOO/);
  });

  it('should display select message when record type is undefined', async () => {
    const mockRunSetResponse = jest.fn(() => Promise.resolve(undefinedRecordTypeRunSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    const warning = screen.getByLabelText('warning message');
    expect(warning).toContainHTML('Select a data table');
  });

  it('should toggle between different states of checked boxes', async () => {
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );

    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockWdlResponse).toHaveBeenCalledTimes(1);

    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[0];
    expect(checkbox).not.toBeChecked();

    // Checking all the checkboxes
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    for (const singleCheckbox of checkboxes) {
      expect(singleCheckbox).toBeChecked();
    }

    // Unchecking all the checkboxes
    await user.click(checkbox);
    for (const singleCheckbox of checkboxes) {
      expect(singleCheckbox).not.toBeChecked();
    }
  });
});

describe('Submitting a run set', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  beforeEach(() => {
    getConfig.mockReturnValue({ wdsUrlRoot, cbasUrlRoot });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  it('should call POST /run_sets endpoint with expected parameters', async () => {
    // ** ARRANGE **
    isFeaturePreviewEnabled.mockImplementation((id) => (id === ENABLE_CROMWELL_APP_CALL_CACHING ? false : isFeaturePreviewEnabled(id)));
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn(() => Promise.resolve(searchResponses.FOO));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    const postRunSetFunction = jest.fn();

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            post: postRunSetFunction,
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );
    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);

    // ** ACT **
    // user selects 'FOO1' record from Data Table
    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[1];
    await user.click(checkbox);

    // ** ASSERT **
    // verify that the record was indeed selected
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    // ** ACT **
    // user clicks on Submit (inputs and outputs should be rendered based on previous submission)
    const button = screen.getByLabelText('Submit button');
    await user.click(button);

    // ** ASSERT **
    // Launch modal should be displayed
    screen.getByText('Send submission');
    const modalSubmitButton = screen.getByLabelText('Launch Submission');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert POST /run_sets endpoint was called with expected parameters
    expect(postRunSetFunction).toHaveBeenCalled();
    expect(postRunSetFunction).toBeCalledWith(
      cbasUrlRoot,
      expect.objectContaining({
        method_version_id: runSetResponse.run_sets[0].method_version_id,
        workflow_input_definitions: runSetInputDef,
        workflow_output_definitions: runSetOutputDef,
        wds_records: {
          record_type: 'FOO',
          record_ids: ['FOO1'],
        },
      })
    );
    expect(postRunSetFunction.mock.lastCall[1]).not.toHaveProperty('call_caching_enabled');
  });

  it('error message should display on workflow launch fail, and not on success', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn(() => Promise.resolve(searchResponses.FOO));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    const postRunSetSuccessResponse = { run_set_id: '00000000-0000-0000-000000000000' };
    const postRunSetErrorResponse = { errors: 'Sample Error Message' };

    const postRunSetFunction = jest.fn();
    postRunSetFunction.mockRejectedValueOnce(postRunSetErrorResponse).mockResolvedValueOnce(postRunSetSuccessResponse);

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            post: postRunSetFunction,
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );
    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);

    // ** ACT **
    // user selects 'FOO1' record from Data Table
    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[1];
    await user.click(checkbox);

    // ** ASSERT **
    // verify that the record was indeed selected
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    // ** ACT **
    // user clicks on Submit (inputs and outputs should be rendered based on previous submission)
    const button = screen.getByLabelText('Submit button');
    await user.click(button);

    // ** ASSERT **
    // Launch modal should be displayed
    screen.getByText('Send submission');
    const modalSubmitButton = screen.getByLabelText('Launch Submission');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert error message on first submit
    expect(postRunSetFunction).toHaveReturned();
    screen.getByLabelText('Modal submission error');
    screen.getByText(postRunSetErrorResponse.errors, { exact: false });
    expect(Nav.goToPath).not.toHaveBeenCalled();

    // ** ACT **
    // user click on Submit button again
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert success on second submit
    expect(postRunSetFunction).toHaveReturned();
    expect(Nav.goToPath).toHaveBeenCalled();
    expect(Nav.goToPath).toHaveBeenCalledWith('workspace-workflows-app-submission-details', {
      name: 'test-azure-ws-name',
      namespace: 'test-azure-ws-namespace',
      submissionId: postRunSetSuccessResponse.run_set_id,
    });
  });

  it('should call POST /run_sets endpoint with expected parameters after an optional input is set to None', async () => {
    // ** ARRANGE **
    isFeaturePreviewEnabled.mockImplementation((id) => (id === ENABLE_CROMWELL_APP_CALL_CACHING ? true : isFeaturePreviewEnabled(id)));
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn(() => Promise.resolve(searchResponses.FOO));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    const postRunSetFunction = jest.fn();

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            post: postRunSetFunction,
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );
    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);

    // ** ACT **
    // user selects 'FOO1' record from Data Table
    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[1];
    await user.click(checkbox);

    // ** ASSERT **
    // verify that the record was indeed selected
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    // ** ACT **
    const inputsTabButton = screen.getByRole('button', { name: 'Inputs' });
    await user.click(inputsTabButton);

    // ** ASSERT **
    const inputTable = screen.getByRole('table');
    const rows = within(inputTable).getAllByRole('row');
    expect(rows.length).toBe(runSetInputDef.length + 1); // one row for each input definition variable, plus headers

    // ** ACT **
    // user sets the source to 'None' for input 'optional_var'
    const thirdInputRow = within(rows[3]).getAllByRole('cell');
    await user.click(within(thirdInputRow[3]).getByText('Type a Value'));
    const selectOption = screen.getByText('None');
    await user.click(selectOption);

    // ** ASSERT **
    // check that the Attribute column has expected behavior
    within(thirdInputRow[4]).getByText('Optional');

    // ** ACT **
    // user clicks on Submit (inputs and outputs should be rendered based on previous submission)
    const button = screen.getByLabelText('Submit button');
    await user.click(button);

    // ** ASSERT **
    // Launch modal should be displayed
    screen.getByText('Send submission');
    const modalSubmitButton = screen.getByLabelText('Launch Submission');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert POST /run_sets endpoint was called with expected parameters and input 'optional_var' has correct definition for source 'None'
    expect(postRunSetFunction).toHaveBeenCalled();
    expect(postRunSetFunction).toBeCalledWith(
      cbasUrlRoot,
      expect.objectContaining({
        call_caching_enabled: true,
        method_version_id: runSetResponse.run_sets[0].method_version_id,
        workflow_input_definitions: [
          runSetInputDef[0],
          runSetInputDef[1],
          {
            input_name: 'target_workflow_1.optional_var',
            input_type: {
              optional_type: {
                primitive_type: 'String',
                type: 'primitive',
              },
              type: 'optional',
            },
            source: {
              type: 'none',
            },
          },
        ],
        workflow_output_definitions: runSetOutputDef,
        wds_records: {
          record_type: 'FOO',
          record_ids: ['FOO1'],
        },
      })
    );
  });

  it('should call POST /run_sets endpoint with expected parameters after struct has been updated', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponseWithStruct));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_root, _instanceId, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    const postRunSetFunction = jest.fn();

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            post: postRunSetFunction,
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );
    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);

    // ** ACT **
    // user selects 'FOO1' record from Data Table
    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[1];
    await user.click(checkbox);

    // ** ASSERT **
    // verify that the record was indeed selected
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    const inputsTabButton = screen.getByRole('button', { name: 'Inputs' });

    // ** ACT **
    await user.click(inputsTabButton);

    // ** ASSERT **
    screen.getByRole('table'); // there should be only one table at this point

    const viewStructLink = screen.getByText('View Struct');
    await user.click(viewStructLink);
    screen.getByText('myInnerStruct');

    const structTable = screen.getByLabelText('struct-table');
    const structRows = within(structTable).getAllByRole('row');
    expect(structRows.length).toBe(6);

    // ** ACT **
    // Update the top-level struct field myPrimitive
    const myPrimitiveRowCells = within(structRows[5]).getAllByRole('cell');
    within(myPrimitiveRowCells[1]).getByText('myPrimitive');
    const myPrimitiveInput = within(myPrimitiveRowCells[4]).getByDisplayValue('Fiesty');
    await user.clear(myPrimitiveInput);
    await user.type(myPrimitiveInput, 'Docile');
    within(myPrimitiveRowCells[4]).getByDisplayValue('Docile');

    // ** ACT **
    // Navigate the struct builder to myInnerStruct
    const myInnerStructRowCells = within(structRows[2]).getAllByRole('cell');
    within(myInnerStructRowCells[1]).getByText('myInnerStruct');
    const viewMyInnerStructLink = within(myInnerStructRowCells[4]).getByText('View Struct');
    await user.click(viewMyInnerStructLink);

    const myInnerStructTable = screen.getByLabelText('struct-table');
    const myInnerStructRows = within(myInnerStructTable).getAllByRole('row');
    expect(myInnerStructRows.length).toBe(3);

    // ** ACT **
    // Update the struct within myInnerStruct
    const myInnermostPrimitiveRowCells = within(myInnerStructRows[1]).getAllByRole('cell');
    within(myInnermostPrimitiveRowCells[1]).getByText('myInnermostPrimitive');
    await user.click(within(myInnermostPrimitiveRowCells[3]).getByText('Select Source'));
    const selectOption = within(screen.getByLabelText('Options')).getByText('Type a Value');
    await user.click(selectOption);
    const myInnermostPrimitiveInput = within(myInnermostPrimitiveRowCells[4]).getByLabelText('Enter a value');
    await user.clear(myInnermostPrimitiveInput);
    await user.type(myInnermostPrimitiveInput, 'bar');
    within(myInnermostPrimitiveRowCells[4]).getByDisplayValue('bar');

    // ** ACT **
    // Exit the modal and submit
    const innerStructModalDoneButton = screen.getByText('Back');
    await user.click(innerStructModalDoneButton);
    const modalDoneButton = screen.getByText('Done');
    await user.click(modalDoneButton);
    screen.getByRole('table'); // there should be only one table again

    // ** ACT **
    // user clicks on Submit (inputs and outputs should be rendered based on previous submission)
    const submitButton = screen.getByLabelText('Submit button');
    await user.click(submitButton);

    // ** ASSERT **
    // Launch modal should be displayed
    screen.getByText('Send submission');
    const modalSubmitButton = screen.getByLabelText('Launch Submission');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert POST /run_sets endpoint was called with expected parameters, with struct input sources updated
    expect(postRunSetFunction).toHaveBeenCalled();
    expect(postRunSetFunction).toBeCalledWith(
      cbasUrlRoot,
      expect.objectContaining({
        method_version_id: runSetResponseWithStruct.run_sets[0].method_version_id,
        workflow_input_definitions: [
          ...runSetInputDef,
          {
            input_name: myStructInput.input_name,
            input_type: myStructInput.input_type,
            source: {
              type: 'object_builder',
              fields: [
                {
                  name: 'myPrimitive',
                  source: {
                    type: 'literal',
                    parameter_value: 'Docile',
                  },
                },
                {
                  name: 'myOptional',
                  source: {
                    type: 'literal',
                    parameter_value: 'Meh',
                  },
                },
                {
                  name: 'myArray',
                  source: {
                    type: 'literal',
                    parameter_value: [],
                  },
                },
                {
                  name: 'myMap',
                  source: {
                    type: 'literal',
                    parameter_value: {},
                  },
                },
                {
                  name: 'myInnerStruct',
                  source: {
                    type: 'object_builder',
                    fields: [
                      {
                        name: 'myInnermostPrimitive',
                        source: {
                          type: 'literal',
                          parameter_value: 'bar',
                        },
                      },
                      {
                        name: 'myInnermostRecordLookup',
                        source: {
                          type: 'record_lookup',
                          record_attribute: 'foo_rating',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
        workflow_output_definitions: runSetOutputDef,
        wds_records: {
          record_type: 'FOO',
          record_ids: ['FOO1'],
        },
      })
    );
  }, 7000);

  it('should call POST /run_sets endpoint with expected parameters after outputs are set to default', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn(() => Promise.resolve(searchResponses.FOO));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));

    const postRunSetFunction = jest.fn();

    await Ajax.mockImplementation(() => {
      return {
        Cbas: {
          runSets: {
            post: postRunSetFunction,
            getForMethod: mockRunSetResponse,
          },
          methods: {
            getById: mockMethodsResponse,
          },
        },
        WorkspaceData: {
          queryRecords: mockSearchResponse,
          describeAllRecordTypes: mockTypesResponse,
        },
        WorkflowScript: {
          get: mockWdlResponse,
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(BaseSubmissionConfig, {
          methodId: '123',
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
        })
      )
    );
    // ** ASSERT **
    expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
    expect(mockTypesResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchResponse).toHaveBeenCalledTimes(1);
    expect(mockMethodsResponse).toHaveBeenCalledTimes(1);

    // ** ACT **
    // user selects 'FOO1' record from Data Table
    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[1];
    await user.click(checkbox);

    // ** ASSERT **
    // verify that the record was indeed selected
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    const outputButton = screen.getByRole('button', { name: 'Outputs' });
    await user.click(outputButton);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const headers = within(rows[0]).getAllByRole('columnheader');

    // set defaults
    await user.click(within(headers[3]).getByRole('button'));

    // ** ACT **
    // user clicks on Submit (inputs and outputs should be rendered based on previous submission)
    const button = screen.getByLabelText('Submit button');
    await user.click(button);

    // ** ASSERT **
    // Launch modal should be displayed
    screen.getByText('Send submission');
    const modalSubmitButton = screen.getByLabelText('Launch Submission');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert POST /run_sets endpoint was called with expected parameters and input 'optional_var' has correct definition for source 'None'
    expect(postRunSetFunction).toHaveBeenCalled();
    expect(postRunSetFunction).toBeCalledWith(
      cbasUrlRoot,
      expect.objectContaining({
        method_version_id: runSetResponse.run_sets[0].method_version_id,
        workflow_input_definitions: runSetInputDef,
        workflow_output_definitions: runSetOutputDefWithDefaults,
        wds_records: {
          record_type: 'FOO',
          record_ids: ['FOO1'],
        },
      })
    );
  });
});
