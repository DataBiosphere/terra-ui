import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { LeoAppStatus, ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { testOnlyExports } from 'src/pages/workspaces/workspace/Data';
import { asMockedFn } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';

import { StorageDetails } from './useWorkspace';

const { WorkspaceData } = testOnlyExports;

type WorkspaceContainerExports = typeof import('src/pages/workspaces/workspace/WorkspaceContainer');
jest.mock('src/pages/workspaces/workspace/WorkspaceContainer', (): WorkspaceContainerExports => {
  return {
    ...jest.requireActual<WorkspaceContainerExports>('src/pages/workspaces/workspace/WorkspaceContainer'),
    wrapWorkspace: jest.fn().mockImplementation((_opts) => (wrappedComponent) => wrappedComponent),
  };
});

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual<AjaxExports>('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

describe('WorkspaceData', () => {
  // When Data.js is broken apart and the WorkspaceData component is converted to TypeScript,
  // this type belongs there.
  interface WorkspaceDataProps {
    namespace: string;
    name: string;
    workspace: WorkspaceWrapper;
    refreshWorkspace: () => void;
    storageDetails: StorageDetails;
  }

  // SIFERS setup, see: https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b362
  function setup({
    namespace = 'test-namespace',
    name = 'test-name',
    workspace,
    refreshWorkspace = () => {},
    storageDetails = {},
    status = 'RUNNING' as LeoAppStatus,
  }) {
    type AjaxContract = ReturnType<typeof Ajax>;
    type WorkspacesContract = AjaxContract['Workspaces'];
    type AppsContract = AjaxContract['Apps'];
    type WorkspaceDataContract = AjaxContract['WorkspaceData'];

    const wdsApp: DeepPartial<ListAppResponse> = {
      proxyUrls: {
        wds: 'https://fake.wds.url/',
      },
      appType: 'WDS',
    };

    const mockGetSchema = jest.fn().mockResolvedValue([]);
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: (_namespace, _name) => ({
          details: jest.fn().mockResolvedValue(workspace),
          listSnapshots: jest.fn().mockResolvedValue([]),
          entityMetadata: jest.fn().mockResolvedValue({}),
        }),
      } as DeepPartial<WorkspacesContract>,
      WorkspaceData: {
        getSchema: mockGetSchema,
      } as DeepPartial<WorkspaceDataContract>,
      Apps: {
        listAppsV2: jest.fn().mockResolvedValue([{ ...wdsApp, status }]),
      } as DeepPartial<AppsContract>,
    };

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    const workspaceDataProps = {
      namespace,
      name,
      workspace,
      refreshWorkspace,
      storageDetails,
    } as WorkspaceDataProps;

    return { workspaceDataProps, mockGetSchema };
  }

  it('displays a waiting message for an azure workspace that is still provisioning in WDS', async () => {
    // Arrange
    const { workspaceDataProps } = setup({ workspace: defaultAzureWorkspace, status: 'PROVISIONING' });

    // Act
    await act(() => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(screen.getByText(/Preparing your data tables/)).toBeVisible();
    expect(screen.queryByText(/Data tables are unavailable/)).toBeNull(); // no error message
  });

  it('displays an error message for an azure workspace that fails when loading schema info', async () => {
    // Arrange
    const { workspaceDataProps, mockGetSchema } = setup({ workspace: defaultAzureWorkspace, status: 'RUNNING' });

    mockGetSchema.mockRejectedValue(new Error('schema error'));

    // Act
    await act(() => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(screen.getByText(/Data tables are unavailable/)).toBeVisible();
    expect(screen.getByText(/Preparing your data tables/)).toBeVisible(); // weird, but current behavior
  });

  it('displays a prompt to select a data type once azure workspace is loaded', async () => {
    // Arrange
    const { workspaceDataProps } = setup({ workspace: defaultAzureWorkspace, status: 'RUNNING' });

    // Act
    await act(() => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(screen.getByText(/Select a data type/)).toBeVisible();
    expect(screen.queryByText(/Data tables are unavailable/)).toBeNull(); // no error message
    expect(screen.queryByText(/Preparing your data tables/)).toBeNull(); // no waiting message
  });
});
