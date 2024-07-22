import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as clipboard from 'clipboard-polyfill/text';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import {
  defaultAzureStorageOptions,
  defaultAzureWorkspace,
  defaultGoogleBucketOptions,
  defaultGoogleWorkspace,
} from 'src/testing/workspace-fixtures';
import { StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { CloudInformation } from 'src/workspaces/dashboard/CloudInformation';

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxExports = typeof import('src/libs/ajax');

jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

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

  it('displays links for an azure workspace', async () => {
    // Arrange
    const storageDetails: StorageDetails = {
      googleBucketLocation: '',
      googleBucketType: '',
      fetchedGoogleBucketLocation: undefined,
      azureContainerRegion: defaultAzureStorageOptions.azureContainerRegion,
      azureContainerUrl: defaultAzureStorageOptions.azureContainerUrl,
      azureContainerSasUrl: defaultAzureStorageOptions.azureContainerSasUrl,
    };
    // Act
    render(
      h(CloudInformation, { workspace: { ...defaultAzureWorkspace, workspaceInitialized: true }, storageDetails })
    );

    // Assert
    expect(screen.getByText('AzCopy')).not.toBeNull();
    expect(screen.getByText('Azure Storage Explorer')).not.toBeNull();
  });

  it('does not retrieve bucket and storage estimate when the workspace is not initialized', async () => {
    // Arrange
    const mockBucketUsage = jest.fn();
    const mockStorageCostEstimate = jest.fn();
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          storageCostEstimate: mockStorageCostEstimate,
          bucketUsage: mockBucketUsage,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    render(
      h(CloudInformation, { workspace: { ...defaultGoogleWorkspace, workspaceInitialized: false }, storageDetails })
    );

    // Assert
    expect(screen.getByTitle('Google Cloud Platform')).not.toBeNull;

    expect(mockBucketUsage).not.toHaveBeenCalled();
    expect(mockStorageCostEstimate).not.toHaveBeenCalled();
  });

  it('retrieves bucket and storage estimate when the workspace is initialized', async () => {
    // Arrange
    const mockBucketUsage = jest.fn().mockResolvedValue({ usageInBytes: 100, lastUpdated: '2023-11-01' });
    const mockStorageCostEstimate = jest.fn().mockResolvedValue({
      estimate: '1 million dollars',
      lastUpdated: '2023-12-01',
    });
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          storageCostEstimate: mockStorageCostEstimate,
          bucketUsage: mockBucketUsage,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    await act(() =>
      render(
        h(CloudInformation, { workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true }, storageDetails })
      )
    );

    // Assert
    expect(screen.getByTitle('Google Cloud Platform')).not.toBeNull;
    // Cost estimate
    expect(screen.getByText('Updated on 12/1/2023')).not.toBeNull();
    expect(screen.getByText('1 million dollars')).not.toBeNull();
    // Bucket usage
    expect(screen.getByText('Updated on 11/1/2023')).not.toBeNull();
    expect(screen.getByText('100 B')).not.toBeNull();

    expect(mockBucketUsage).toHaveBeenCalled();
    expect(mockStorageCostEstimate).toHaveBeenCalled();
  });

  const copyButtonTestSetup = async () => {
    const captureEvent = jest.fn();
    const mockBucketUsage = jest.fn();
    const mockStorageCostEstimate = jest.fn();
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          storageCostEstimate: mockStorageCostEstimate,
          bucketUsage: mockBucketUsage,
        }),
      },
      Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
    } as DeepPartial<AjaxContract> as AjaxContract);

    await act(() =>
      render(
        h(CloudInformation, { workspace: { ...defaultGoogleWorkspace, workspaceInitialized: false }, storageDetails })
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
    const mockBucketUsage = jest.fn().mockResolvedValue({ usageInBytes: 15, lastUpdated: '2024-07-15' });
    const mockStorageCostEstimate = jest.fn().mockResolvedValue({
      estimate: '2 dollars',
      lastUpdated: '2024-07-15',
    });
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          storageCostEstimate: mockStorageCostEstimate,
          bucketUsage: mockBucketUsage,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    render(
      h(CloudInformation, { workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true }, storageDetails })
    );
    await user.click(screen.getByLabelText('More info'));

    // Assert
    expect(
      screen.getAllByText('Based on list price. Does not include savings from Autoclass or other discounts.')
    ).not.toBeNull();
  });
});
