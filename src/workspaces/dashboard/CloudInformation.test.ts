import { asMockedFn, partial } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as clipboard from 'clipboard-polyfill/text';
import { h } from 'react-hyperscript-helpers';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import {
  defaultAzureWorkspace,
  defaultGoogleBucketOptions,
  defaultGoogleWorkspace,
} from 'src/testing/workspace-fixtures';
import { StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { CloudInformation } from 'src/workspaces/dashboard/CloudInformation';

jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');
jest.mock('src/libs/notifications');

type ClipboardPolyfillExports = typeof import('clipboard-polyfill/text');
jest.mock('clipboard-polyfill/text', (): ClipboardPolyfillExports => {
  const actual = jest.requireActual<ClipboardPolyfillExports>('clipboard-polyfill/text');
  return {
    ...actual,
    writeText: jest.fn().mockResolvedValue(undefined),
  };
});

describe('CloudInformation', () => {
  const storageDetails: StorageDetails = {
    googleBucketLocation: defaultGoogleBucketOptions.googleBucketLocation,
    googleBucketType: defaultGoogleBucketOptions.googleBucketType,
    fetchedGoogleBucketLocation: defaultGoogleBucketOptions.fetchedGoogleBucketLocation,
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders Google Cloud information correctly', async () => {
    // Arrange
    const workspace = { ...defaultGoogleWorkspace, workspaceInitialized: true };
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            storageCostEstimateV2: jest.fn().mockResolvedValue({
              estimate: 1000000,
              usage: { 'live-object': 100 },
              lastUpdated: '2023-12-01',
            }),
          }),
      })
    );

    // Act
    await act(async () => {
      render(h(CloudInformation, { workspace: { ...workspace }, storageDetails }));
    });

    // Assert
    expect(screen.getByText('Cloud Name')).toBeInTheDocument();
    expect(screen.getByTitle('Google Cloud Platform')).toBeInTheDocument();
    expect(screen.getByText('Google Project ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Copy google project ID to clipboard')).toBeInTheDocument();
    expect(screen.getByText('Storage Details')).toBeInTheDocument();
  });

  it('renders nothing for non-Google workspaces', async () => {
    // Arrange
    const workspace = { ...defaultAzureWorkspace, workspaceInitialized: true };

    // Act
    render(h(CloudInformation, { workspace, storageDetails }));

    // Assert
    expect(screen.queryByText('Cloud Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Google Project ID')).not.toBeInTheDocument();
  });

  const copyButtonTestSetup = async () => {
    const captureEvent = jest.fn();
    const mockStorageCostEstimateV2 = jest.fn();
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            storageCostEstimateV2: mockStorageCostEstimateV2,
          }),
      })
    );
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));

    await act(() =>
      render(
        h(CloudInformation, {
          workspace: { ...defaultGoogleWorkspace, workspaceInitialized: false },
          storageDetails,
        })
      )
    );
    return captureEvent;
  };

  it('emits an event when the copy google project ID button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const captureEvent = await copyButtonTestSetup();

    // Act
    const copyButton = screen.getByLabelText('Copy google project ID to clipboard');
    await user.click(copyButton);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(
      Events.workspaceDashboardCopyGoogleProjectId,
      extractWorkspaceDetails(defaultGoogleWorkspace)
    );
    expect(clipboard.writeText).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject);
  });

  it('does not retrieve bucket and storage estimate when the workspace is not initialized', async () => {
    // Arrange
    const mockStorageCostEstimateV2 = jest.fn();
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            storageCostEstimateV2: mockStorageCostEstimateV2,
          }),
      })
    );

    // Act
    render(
      h(CloudInformation, { workspace: { ...defaultGoogleWorkspace, workspaceInitialized: false }, storageDetails })
    );

    // Assert
    expect(mockStorageCostEstimateV2).not.toHaveBeenCalled();
  });

  it('retrieves bucket and storage estimate when the workspace is initialized', async () => {
    // Arrange
    const mockStorageCostEstimateV2 = jest.fn().mockResolvedValue({
      estimate: 1000000,
      usageInBytes: 100,
      usage: {
        'live-object': 100,
      },
      lastUpdated: '2023-12-01',
    });
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            storageCostEstimateV2: mockStorageCostEstimateV2,
          }),
      })
    );

    // Act
    await act(() =>
      render(
        h(CloudInformation, {
          workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true },
          storageDetails,
        })
      )
    );

    // Assert
    // Cost estimate
    expect(screen.getByText('Estimated Monthly Cost')).not.toBeNull();
    expect(screen.getByText('$1,000,000.00')).not.toBeNull();
    // Bucket usage
    expect(screen.getByText('100 B Live')).not.toBeNull();

    expect(mockStorageCostEstimateV2).toHaveBeenCalled();
  });

  it('emits an event when the copy bucket name button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const captureEvent = await copyButtonTestSetup();

    // Act
    const copyButton = screen.getByLabelText('Copy bucket name to clipboard');
    await user.click(copyButton);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(
      Events.workspaceDashboardCopyBucketName,
      extractWorkspaceDetails(defaultGoogleWorkspace)
    );
    expect(clipboard.writeText).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.bucketName);
  });

  it('can use the info button to display additional information about cost', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockStorageCostEstimateV2 = jest.fn().mockResolvedValue({
      estimate: 2.0,
      usageInBytes: 15,
      usage: {},
      lastUpdated: '2024-07-15',
    });
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            storageCostEstimateV2: mockStorageCostEstimateV2,
          }),
      })
    );

    // Act
    await act(async () => {
      render(
        h(CloudInformation, { workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true }, storageDetails })
      );
    });

    const moreInfoButtons = screen.getAllByLabelText('More info');
    await user.click(moreInfoButtons[0]); // First button is in the storage details

    // Assert
    expect(screen.getByText(/Only shows object storage costs/i)).toBeInTheDocument();
    expect(screen.getByText(/Based on GCP list prices/i)).toBeInTheDocument();

    // Clicking the info button again should hide the tooltip
    await user.click(moreInfoButtons[0]);

    // Expect the tooltip content to disappear
    expect(screen.queryByText(/Only shows object storage costs/i)).not.toBeInTheDocument();
  });

  it('displays bucket size for users with reader access', async () => {
    // Arrange
    const mockStorageCostEstimateV2 = jest.fn().mockResolvedValue({
      estimate: 1.23,
      usageInBytes: 50,
      usage: { 'live-object': 50 },
      lastUpdated: '2024-07-26',
    });
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () => partial<WorkspaceContract>({ storageCostEstimateV2: mockStorageCostEstimateV2 }),
      })
    );

    // Act
    await act(() =>
      render(
        h(CloudInformation, {
          workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true, accessLevel: 'READER' },
          storageDetails,
        })
      )
    );

    // Assert
    expect(screen.getByText('50 B Live')).not.toBeNull();
    expect(mockStorageCostEstimateV2).toHaveBeenCalled();
  });

  it('renders the bucket size by storage state', async () => {
    // Arrange
    const usageByState = {
      'live-object': 40,
      'soft-deleted-object': 10,
    };
    const mockStorageCostEstimateV2 = jest
      .fn()
      .mockResolvedValue({ estimate: 1.23, usageInBytes: 50, usage: usageByState, lastUpdated: '2024-07-26' });
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () => partial<WorkspaceContract>({ storageCostEstimateV2: mockStorageCostEstimateV2 }),
      })
    );

    // Act
    await act(() =>
      render(
        h(CloudInformation, {
          workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true, accessLevel: 'READER' },
          storageDetails,
        })
      )
    );

    // Assert
    expect(mockStorageCostEstimateV2).toHaveBeenCalled();
    expect(screen.queryByText(/40 B Live/i)).toBeInTheDocument();
    expect(screen.queryByText(/10 B Soft Deleted/i)).toBeInTheDocument();
  });

  it('hides soft-deleted bucket size when no soft-deleted objects exist', async () => {
    // Arrange
    const usageByState = {
      'live-object': 50,
    };
    const mockStorageCostEstimateV2 = jest
      .fn()
      .mockResolvedValue({ estimate: 1.23, usageInBytes: 50, usage: usageByState, lastUpdated: '2024-07-26' });
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () => partial<WorkspaceContract>({ storageCostEstimateV2: mockStorageCostEstimateV2 }),
      })
    );

    // Act
    await act(() =>
      render(
        h(CloudInformation, {
          workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true, accessLevel: 'READER' },
          storageDetails,
        })
      )
    );

    // Assert
    expect(mockStorageCostEstimateV2).toHaveBeenCalled();
    expect(screen.queryByText(/50 B Live/i)).toBeInTheDocument();
    expect(screen.queryByText(/.*Soft Deleted/i)).not.toBeInTheDocument();
  });

  it('emits an event when the Open project in Google Cloud Console link is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const captureEvent = jest.fn();
    const mockStorageCostEstimateV2 = jest.fn();

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            storageCostEstimateV2: mockStorageCostEstimateV2,
          }),
      })
    );
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));

    // Act
    render(
      h(CloudInformation, { workspace: { ...defaultGoogleWorkspace, workspaceInitialized: false }, storageDetails })
    );
    const consoleLink = screen.getByText('Open project in Google Cloud Console');
    expect(consoleLink).toBeInTheDocument();

    // Check the href attribute has the correct URL format
    const linkElement = consoleLink.closest('a');
    expect(linkElement).toHaveAttribute(
      'href',
      expect.stringMatching(
        `https://console.cloud.google.com/welcome\\?project=${defaultGoogleWorkspace.workspace.googleProject}&authuser=.*`
      )
    );

    // Simulate clicking the link
    await user.click(consoleLink);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(
      Events.workspaceOpenedProjectInConsole,
      extractWorkspaceDetails(defaultGoogleWorkspace)
    );
  });
  it('renders the quota section', async () => {
    // Arrange
    const mockStorageCostEstimateV2 = jest.fn().mockResolvedValue({
      estimate: 1000000,
      usageInBytes: 100,
      usage: {
        'live-object': 100,
      },
      lastUpdated: '2023-12-01',
    });
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            storageCostEstimateV2: mockStorageCostEstimateV2,
          }),
      })
    );

    // Act
    await act(() =>
      render(
        h(CloudInformation, {
          workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true },
          storageDetails,
        })
      )
    );

    // Assert
    expect(screen.getByText('Quota')).toBeInTheDocument();
    expect(screen.getByText('View quotas')).toBeInTheDocument();
    expect(screen.getByText('Open quota adjuster')).toBeInTheDocument();
  });
});
