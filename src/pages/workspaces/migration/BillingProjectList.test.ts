import { act, screen, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { abandonedPromise } from 'src/libs/utils';
import { BillingProjectList, inProgressRefreshRate } from 'src/pages/workspaces/migration/BillingProjectList';
import { mockServerData } from 'src/pages/workspaces/migration/migration-utils.test';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxWorkspacesContract = AjaxContract['Workspaces'];
jest.mock('src/libs/ajax');

describe('BillingProjectList', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('shows a loading indicator', async () => {
    // Arrange
    const mockWorkspaces: Partial<AjaxWorkspacesContract> = {
      bucketMigrationInfo: jest.fn().mockReturnValue(abandonedPromise()),
    };
    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    render(h(BillingProjectList, []));

    // Assert
    await screen.findByText('Fetching billing projects');
  });

  it('shows a message if there are no workspaces to migrate', async () => {
    // Arrange
    const mockWorkspaces: Partial<AjaxWorkspacesContract> = {
      bucketMigrationInfo: jest.fn().mockResolvedValue({}),
    };
    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    render(h(BillingProjectList, []));

    // Assert
    await screen.findByText('You have no workspaces to migrate');
    expect(screen.queryByText('Fetching billing projects')).toBeNull();
  });

  it('shows the list of billing projects with workspaces', async () => {
    // Arrange
    const mockWorkspaces: Partial<AjaxWorkspacesContract> = {
      bucketMigrationInfo: jest.fn().mockResolvedValue(mockServerData),
    };
    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    render(h(BillingProjectList, []));

    // Assert
    const billingProjects = await screen.findAllByRole('listitem');
    await within(billingProjects[0]).findByText('CARBilling-2');
    await within(billingProjects[0]).findByText('april29');
    await within(billingProjects[0]).findByText('notmigrated');

    await within(billingProjects[1]).findByText('CARBillingTest');
    await within(billingProjects[1]).findByText('testdata');

    await within(billingProjects[2]).findByText('general-dev-billing-account');
    await within(billingProjects[2]).findByText('Christina test');

    expect(screen.queryByText('Fetching billing projects')).toBeNull();
    expect(screen.queryByText('You have no workspaces to migrate')).toBeNull();
  });

  it('refreshes an in-progress workspace', async () => {
    // Arrange
    const mockUpdateData = {
      'general-dev-billing-account/Christina test': {
        finalBucketTransferProgress: {
          bytesTransferred: 0,
          objectsTransferred: 0,
          totalBytesToTransfer: 0,
          totalObjectsToTransfer: 0,
        },
        migrationStep: 'PreparingTransferToFinalBucket' as const,
        tempBucketTransferProgress: {
          bytesTransferred: 1000,
          objectsTransferred: 2,
          totalBytesToTransfer: 2000,
          totalObjectsToTransfer: 4,
        },
      },
    };
    const mockBatchProgress = jest.fn().mockResolvedValue(mockUpdateData);
    const mockWorkspaces: Partial<AjaxWorkspacesContract> = {
      bucketMigrationInfo: jest.fn().mockResolvedValue(mockServerData),
      bucketMigrationProgress: mockBatchProgress,
    };
    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    await act(() => render(h(BillingProjectList, [])));

    let billingProjects = await screen.findAllByRole('listitem');
    await within(billingProjects[2]).findByText('Initial Transfer in Progress (1000 B/1.95 KiB)');

    // Act
    await act(async () => {
      jest.advanceTimersByTime(inProgressRefreshRate);
    });

    expect(mockBatchProgress).toHaveBeenCalledWith([
      { name: 'Christina test', namespace: 'general-dev-billing-account' },
    ]);

    billingProjects = await screen.findAllByRole('listitem');
    await within(billingProjects[2]).findByText('Creating Destination Bucket');
  });
});
