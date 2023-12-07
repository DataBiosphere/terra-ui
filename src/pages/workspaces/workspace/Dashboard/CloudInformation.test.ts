import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { StorageDetails } from 'src/pages/workspaces/hooks/useWorkspace';
import { CloudInformation } from 'src/pages/workspaces/workspace/Dashboard/CloudInformation';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import {
  defaultAzureStorageOptions,
  defaultAzureWorkspace,
  defaultGoogleBucketOptions,
  defaultGoogleWorkspace,
} from 'src/testing/workspace-fixtures';

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxExports = typeof import('src/libs/ajax');

jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

describe('CloudInformation', () => {
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
    const storageDetails: StorageDetails = {
      googleBucketLocation: defaultGoogleBucketOptions.googleBucketLocation,
      googleBucketType: defaultGoogleBucketOptions.googleBucketType,
      fetchedGoogleBucketLocation: defaultGoogleBucketOptions.fetchedGoogleBucketLocation,
    };

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
    const storageDetails: StorageDetails = {
      googleBucketLocation: defaultGoogleBucketOptions.googleBucketLocation,
      googleBucketType: defaultGoogleBucketOptions.googleBucketType,
      fetchedGoogleBucketLocation: defaultGoogleBucketOptions.fetchedGoogleBucketLocation,
    };

    const mockBucketUsage = jest.fn().mockResolvedValue({ usageInBytes: 100, lastUpdated: '2023-12-01' });
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

    expect(mockBucketUsage).toHaveBeenCalled();
    expect(mockStorageCostEstimate).toHaveBeenCalled();
  });
});
