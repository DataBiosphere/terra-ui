import '@testing-library/jest-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';
import { workspaceStore } from 'src/libs/state';
import { SubmissionConfig } from 'src/workflows-app/SubmissionConfig';
import {
  azureStorageDetails,
  methodsResponse,
  mockApps,
  mockAzureWorkspace,
  runSetResponse,
  searchResponses,
  typesResponse,
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

jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}));

// SubmissionConfig component uses AutoSizer to determine the right size for table to be displayed. As a result we need to
// mock out the height and width so that when AutoSizer asks for the width and height of "browser" it can use the mocked
// values and render the component properly. Without this the tests will be break.
// (see https://github.com/bvaughn/react-virtualized/issues/493 and https://stackoverflow.com/a/62214834)
const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

describe('SubmissionConfig renders workflow details', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 1000 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
  });

  beforeEach(() => {
    getConfig.mockReturnValue({ wdsUrlRoot: 'http://localhost:3000/wds', cbasUrlRoot: 'http://localhost:8080/cbas' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  });

  it('should render workflow details', async () => {
    // ** ARRANGE **
    const mockRunSetResponse = jest.fn(() => Promise.resolve(runSetResponse));
    const mockMethodsResponse = jest.fn(() => Promise.resolve(methodsResponse));
    const mockSearchResponse = jest.fn((_, recordType) => Promise.resolve(searchResponses[recordType]));
    const mockTypesResponse = jest.fn(() => Promise.resolve(typesResponse));
    const mockWdlResponse = jest.fn(() => Promise.resolve('mock wdl response'));
    const mockLeoResponse = jest.fn(() => Promise.resolve(mockApps));

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
        Workspaces: {
          workspace: jest.fn().mockReturnValue({
            details: jest.fn(() => Promise.resolve(azureStorageDetails)),
          }),
        },
      };
    });

    workspaceStore.set(mockAzureWorkspace);

    // ** ACT **
    render(
      h(SubmissionConfig, {
        methodId: '123',
        name: 'test-azure-ws-name',
        namespace: 'test-azure-ws-namespace',
        mockAzureWorkspace,
      })
    );

    // ** ASSERT **
    await waitFor(() => {
      expect(mockRunSetResponse).toHaveBeenCalledTimes(1);
      expect(mockTypesResponse).toHaveBeenCalledTimes(1);
      expect(mockMethodsResponse).toHaveBeenCalledTimes(1);
      expect(mockSearchResponse).toHaveBeenCalledTimes(1);
      expect(mockWdlResponse).toHaveBeenCalledTimes(1);
      expect(mockLeoResponse).toHaveBeenCalledTimes(0);
    });

    expect(screen.getByText('Workflow Version:')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();

    expect(screen.getByText('Workflow source URL:')).toBeInTheDocument();
    expect(
      screen.getByText('https://raw.githubusercontent.com/DataBiosphere/cbas/main/useful_workflows/target_workflow_1/target_workflow_1.wdl')
    ).toBeInTheDocument();

    const workflowScriptLink = screen.getByRole('button', { name: 'View Workflow Script' });
    expect(workflowScriptLink).toBeInTheDocument();
    expect(workflowScriptLink.getAttribute('aria-disabled')).toBe('false');

    // ** ACT **
    // user clicks on View Workflow Script to open the modal
    await act(async () => {
      await userEvent.click(workflowScriptLink);
    });

    // ** ASSERT **
    // verify that modal was rendered on screen
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Workflow Script')).toBeInTheDocument();
  });
});
