import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { LeoAppStatus, ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { reportError } from 'src/libs/error';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleBucketOptions } from 'src/testing/workspace-fixtures';
import { StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import { WorkspaceData } from './Data';

type WorkspaceContainerExports = typeof import('src/workspaces/container/WorkspaceContainer');
jest.mock('src/workspaces/container/WorkspaceContainer', (): WorkspaceContainerExports => {
  return {
    ...jest.requireActual<WorkspaceContainerExports>('src/workspaces/container/WorkspaceContainer'),
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

jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}));

const cwdsUrlRoot = 'https://cwds.test.url';

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({ cwdsUrlRoot }),
}));

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');

jest.mock('src/libs/ajax/ajax-common', (): AjaxCommonExports => {
  return {
    ...jest.requireActual<AjaxCommonExports>('src/libs/ajax/ajax-common'),
    fetchWDS: jest.fn().mockImplementation(() => {
      return jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
      });
    }),
  };
});

// When Data.js is broken apart and the WorkspaceData component is converted to TypeScript,
// this type belongs there.
interface WorkspaceDataProps {
  namespace: string;
  name: string;
  workspace: WorkspaceWrapper;
  refreshWorkspace: () => void;
  storageDetails: StorageDetails;
}
type AjaxContract = ReturnType<typeof Ajax>;

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('WorkspaceData', () => {
  type SetupOptions = {
    namespace?: string;
    name?: string;
    workspace: WorkspaceWrapper;
    refreshWorkspace?: () => void;
    storageDetails?: StorageDetails;
    status: LeoAppStatus;
    wdsUrl?: string | undefined;
  };
  type SetupResult = {
    workspaceDataProps: WorkspaceDataProps;
    listAppResponse: DeepPartial<ListAppItem>;
    mockGetSchema: jest.Mock;
    mockListAppsV2: jest.Mock;
    mockEntityMetadata: jest.Mock;
    mockListSnapshots: jest.Mock;
  };

  // Used for parameterized tests that check the waiting message for a given app status
  type StatusParams = {
    status: LeoAppStatus;
    expectedMessage: RegExp;
  };

  const populatedAzureStorageOptions = {
    azureContainerRegion: 'eastus',
    azureContainerUrl: 'container-url',
    azureContainerSasUrl: 'container-url?sas',
  };

  // SIFERS setup, see: https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b362
  function setup({
    namespace = 'test-namespace',
    name = 'test-name',
    workspace,
    refreshWorkspace = () => {},
    storageDetails = { ...defaultGoogleBucketOptions, ...populatedAzureStorageOptions },
    status = 'RUNNING',
    wdsUrl = 'http://fake.wds.url',
  }: SetupOptions): SetupResult {
    const listAppResponse: DeepPartial<ListAppItem> = {
      proxyUrls: {
        wds: wdsUrl,
      },
      appType: 'WDS',
      status,
    };

    const mockGetCapabilities = jest.fn().mockResolvedValue({});
    const mockGetSchema = jest.fn().mockResolvedValue([]);
    const mockListAppsV2 = jest.fn().mockResolvedValue([listAppResponse]);
    const mockEntityMetadata = jest.fn().mockRejectedValue([]);
    const mockListSnapshots = jest.fn().mockRejectedValue({});
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: (_namespace, _name) => ({
          details: jest.fn().mockResolvedValue(workspace),
          listSnapshots: mockListSnapshots,
          entityMetadata: mockEntityMetadata,
        }),
      },
      WorkspaceData: {
        getCapabilities: mockGetCapabilities,
        getSchema: mockGetSchema,
      },
      Apps: {
        listAppsV2: mockListAppsV2,
      },
    };

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    const workspaceDataProps: WorkspaceDataProps = {
      namespace,
      name,
      workspace,
      refreshWorkspace,
      storageDetails,
    };

    return {
      workspaceDataProps,
      listAppResponse,
      mockGetSchema,
      mockListAppsV2,
      mockEntityMetadata,
      mockListSnapshots,
    };
  }

  it('displays a waiting message for an azure workspace that is still provisioning in WDS', async () => {
    // Arrange
    const { workspaceDataProps, mockGetSchema } = setup({
      workspace: defaultAzureWorkspace,
      status: 'PROVISIONING',
      wdsUrl: undefined, // no WDS URL yet
    });

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(screen.getByText(/Preparing your data tables/)).toBeVisible();
    expect(screen.queryByText(/Data tables are unavailable/)).toBeNull(); // no error message
    expect(mockGetSchema).not.toHaveBeenCalled(); // never tried fetching schema, which depends on wds URL
  });

  it('does not accidentally fetch schema before the proxyURL has been set', async () => {
    // Arrange
    const { workspaceDataProps, mockGetSchema } = setup({
      workspace: defaultAzureWorkspace,
      status: 'PROVISIONING',
      wdsUrl: undefined, // no WDS URL yet
    });

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(screen.getByText(/Preparing your data tables/)).toBeVisible();
    expect(screen.queryByText(/Data tables are unavailable/)).toBeNull(); // no error message
    expect(mockGetSchema).not.toHaveBeenCalled(); // never tried fetching schema, which depends on wds URL
  });

  it.each([
    { status: 'PROVISIONING' as LeoAppStatus, expectedMessage: /Preparing your data tables/ },
    { status: 'UPDATING' as LeoAppStatus, expectedMessage: /Updating your data tables/ },
  ])(
    'displays a waiting message for an azure workspace with $status status',
    async ({ status, expectedMessage }: StatusParams) => {
      // Arrange
      const { workspaceDataProps } = setup({
        workspace: defaultAzureWorkspace,
        status,
      });

      // Act
      await act(async () => {
        render(h(WorkspaceData, workspaceDataProps));
      });

      // Assert
      expect(screen.getByText(expectedMessage)).toBeVisible();
      expect(screen.queryByText(/Data tables are unavailable/)).toBeNull(); // no error message
    }
  );

  it('displays an error message for an azure workspace whose status is ERROR', async () => {
    // Arrange
    const { workspaceDataProps } = setup({
      workspace: defaultAzureWorkspace,
      status: 'ERROR',
    });

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(screen.getByText(/Data tables are unavailable/)).toBeVisible();
    expect(screen.getByText(/An error occurred while preparing/)).toBeVisible(); // display error message
    expect(screen.queryByText(/Preparing your data tables/)).toBeNull(); // no waiting message
  });

  it('displays an error message for an azure workspace that fails when resolving the app', async () => {
    // Arrange
    const { workspaceDataProps, mockListAppsV2 } = setup({
      workspace: defaultAzureWorkspace,
      status: 'RUNNING',
    });

    const mockedError = new Error('app resolve error');
    mockListAppsV2.mockRejectedValue(mockedError);

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(screen.getByText(/Data tables are unavailable/)).toBeVisible();
    expect(screen.getByText(/An error occurred while preparing/)).toBeVisible(); // display error message
    expect(screen.queryByText(/Preparing your data tables/)).toBeNull(); // no waiting message
    expect(reportError).toHaveBeenCalledWith('Error resolving WDS app', mockedError);
  });

  it('displays an error message for an azure workspace that fails when loading schema info', async () => {
    // Arrange
    const { workspaceDataProps, mockGetSchema } = setup({
      workspace: defaultAzureWorkspace,
      status: 'RUNNING',
    });

    const mockedError = new Error('schema error');
    mockGetSchema.mockRejectedValue(mockedError);

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(screen.getByText(/Data tables are unavailable/)).toBeVisible();
    expect(screen.getByText(/An error occurred while preparing/)).toBeVisible(); // display error message
    expect(screen.queryByText(/Preparing your data tables/)).toBeNull(); // no waiting message
    expect(reportError).toHaveBeenCalledWith('Error loading WDS schema', mockedError);
  });

  it('stops polling for app status if app reaches an ERROR status', async () => {
    // Arrange
    const { workspaceDataProps, mockListAppsV2, listAppResponse, mockGetSchema } = setup({
      workspace: defaultAzureWorkspace,
      status: 'PROVISIONING',
    });

    mockListAppsV2
      .mockResolvedValueOnce([{ ...listAppResponse, status: 'PROVISIONING' }])
      .mockResolvedValueOnce([{ ...listAppResponse, status: 'ERROR' }]);

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalledTimes(1); // initial call, provisioning
    expect(screen.getByText(/Preparing your data tables/)).toBeVisible();

    // Act
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalledTimes(2); // second call, error
    expect(screen.getByText(/An error occurred while preparing/)).toBeVisible(); // display error message
    expect(screen.queryByText(/Preparing your data tables/)).toBeNull(); // no waiting message

    // Act
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalledTimes(2); // no further calls
    expect(mockGetSchema).not.toHaveBeenCalled(); // never tried fetching schema, which depends on app status
  });

  it('stops polling for schema info if an error occurs while doing so', async () => {
    // Arrange
    const { workspaceDataProps, mockListAppsV2, mockGetSchema } = setup({
      workspace: defaultAzureWorkspace,
      status: 'RUNNING',
    });

    mockGetSchema.mockRejectedValue(new Error('schema error'));

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalledTimes(1); // only expected call, provisioning
    expect(mockGetSchema).toHaveBeenCalledTimes(1); // only expected call, which resulted in an error
    expect(screen.getByText(/An error occurred while preparing/)).toBeVisible(); // display error message

    // Act
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalledTimes(1); // no further invocations
    expect(mockGetSchema).toHaveBeenCalledTimes(1); // no further invocations
  });

  it.each([
    { status: 'PROVISIONING' as LeoAppStatus, expectedMessage: /Preparing your data tables/ },
    { status: 'UPDATING' as LeoAppStatus, expectedMessage: /Updating your data tables/ },
  ])('polls for schema until $status app is RUNNING', async ({ status, expectedMessage }: StatusParams) => {
    // Arrange
    const { workspaceDataProps, mockListAppsV2, listAppResponse, mockGetSchema } = setup({
      workspace: {
        ...defaultAzureWorkspace,
        workspace: {
          ...defaultAzureWorkspace.workspace,
          workspaceId: 'test-workspace-id',
        },
      },
      status,
    });

    mockListAppsV2
      .mockResolvedValueOnce([{ ...listAppResponse, status, proxyUrls: {} }])
      .mockResolvedValueOnce([{ ...listAppResponse, status, proxyUrls: {} }])
      .mockResolvedValueOnce([{ ...listAppResponse, status: 'RUNNING', proxyUrls: { wds: 'http://test.wds.url' } }]);

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalledTimes(1); // initial call, not yet running
    expect(mockGetSchema).not.toHaveBeenCalled(); // don't fetch schema yet
    expect(screen.queryByText(/Select a data type/)).toBeNull();
    expect(screen.getByText(expectedMessage)).toBeVisible();

    // Act
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalledTimes(2); // second call, still pending
    expect(mockGetSchema).not.toHaveBeenCalled(); // don't fetch schema yet
    expect(screen.queryByText(/Select a data type/)).toBeNull();
    expect(screen.getByText(expectedMessage)).toBeVisible();

    // Act
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    // Assert
    expect(mockListAppsV2).toHaveBeenCalledTimes(3); // third call, now running
    expect(mockListAppsV2).toHaveBeenCalledWith('test-workspace-id'); // it should have been called with the correct ID
    expect(mockGetSchema).toHaveBeenCalledWith('http://test.wds.url', 'test-workspace-id'); // fetch schema after running

    expect(screen.getByText(/Select a data type/)).toBeVisible();
    expect(screen.queryByText(expectedMessage)).toBeNull(); // no waiting message
    expect(screen.queryByText(/Data tables are unavailable/)).toBeNull(); // no error message
  });

  it('does not call Rawls for metadata on loading an azure workspace', async () => {
    // Arrange
    const { workspaceDataProps, mockEntityMetadata } = setup({
      workspace: defaultAzureWorkspace,
      status: 'RUNNING',
    });

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(mockEntityMetadata).not.toHaveBeenCalled();
  });

  it('does not call Rawls for snapshot metadata on loading an azure workspace', async () => {
    // Arrange
    const { workspaceDataProps, mockListSnapshots } = setup({
      workspace: defaultAzureWorkspace,
      status: 'RUNNING',
    });

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(mockListSnapshots).not.toHaveBeenCalled();
  });
});
