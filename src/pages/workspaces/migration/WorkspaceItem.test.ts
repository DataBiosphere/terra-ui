import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { MigrationStep, WorkspaceMigrationInfo } from 'src/pages/workspaces/migration/migration-utils';
import { WorkspaceItem } from 'src/pages/workspaces/migration/WorkspaceItem';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

describe('WorkspaceItem', () => {
  it('shows the workspace name for an unscheduled workspace', async () => {
    // Arrange
    const unscheduledWorkspace: WorkspaceMigrationInfo = {
      namespace: 'billing project',
      name: 'workspace name',
      migrationStep: 'Unscheduled',
    };

    // Act
    render(h(WorkspaceItem, unscheduledWorkspace));

    // Assert
    await screen.findByText('workspace name');
  });

  it('shows completed workspace status', async () => {
    // Arrange
    const completedWorkspace: WorkspaceMigrationInfo = {
      failureReason: undefined,
      finalBucketTransferProgress: {
        bytesTransferred: 288912,
        objectsTransferred: 561,
        totalBytesToTransfer: 288912,
        totalObjectsToTransfer: 561,
      },
      migrationStep: 'Finished',
      name: 'april29',
      namespace: 'CARBilling-2',
      outcome: 'success',
      tempBucketTransferProgress: {
        bytesTransferred: 288912,
        objectsTransferred: 561,
        totalBytesToTransfer: 288912,
        totalObjectsToTransfer: 561,
      },
    };

    // Act
    render(h(WorkspaceItem, completedWorkspace));

    // Assert
    await screen.findByText('april29');
    await screen.findByText('Migration Complete');
  });

  it('shows failed workspace status with no accessibility errors', async () => {
    // Arrange
    const user = userEvent.setup();
    const failedWorkspace: WorkspaceMigrationInfo = {
      failureReason: 'Bucket migration failure reason',
      finalBucketTransferProgress: undefined,
      migrationStep: 'Finished',
      name: 'testdata',
      namespace: 'CARBillingTest',
      outcome: 'failure',
      tempBucketTransferProgress: undefined,
    };

    // Act
    const { container } = render(h(WorkspaceItem, failedWorkspace));
    const infoButton = screen.getByLabelText('More info');
    await user.click(infoButton);

    // Assert
    await screen.findByText('testdata');
    await screen.findByText('Migration Failed');
    await screen.findByText('Bucket migration failure reason');
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    { migrationStep: 'ScheduledForMigration' as MigrationStep, expectedStatus: 'Starting Migration' },
    { migrationStep: 'PreparingTransferToTempBucket' as MigrationStep, expectedStatus: 'Preparing Original Bucket' },
    { migrationStep: 'PreparingTransferToFinalBucket' as MigrationStep, expectedStatus: 'Creating Destination Bucket' },
    { migrationStep: 'FinishingUp' as MigrationStep, expectedStatus: 'Finishing Migration' },
    { migrationStep: 'Finished' as MigrationStep, expectedStatus: 'Finishing Migration' },
  ])(
    'renders status for state "$migrationStep" with no accessibility errors',
    async ({ migrationStep, expectedStatus }) => {
      // Arrange
      const workspace: WorkspaceMigrationInfo = {
        namespace: 'billing project',
        name: 'workspace name',
        migrationStep,
      };

      // Act
      const { container } = render(h(WorkspaceItem, workspace));

      // Assert
      await screen.findByText(expectedStatus);
      expect(await axe(container)).toHaveNoViolations();
    }
  );

  it('shows transfer to temp bucket state with bytes', async () => {
    // Arrange
    const transferringWorkspace: WorkspaceMigrationInfo = {
      failureReason: undefined,
      finalBucketTransferProgress: {
        bytesTransferred: 0,
        objectsTransferred: 0,
        totalBytesToTransfer: 0,
        totalObjectsToTransfer: 0,
      },
      migrationStep: 'TransferringToTempBucket',
      name: 'Christina test',
      namespace: 'general-dev-billing-account',
      outcome: undefined,
      tempBucketTransferProgress: {
        bytesTransferred: 1000,
        objectsTransferred: 2,
        totalBytesToTransfer: 2000,
        totalObjectsToTransfer: 4,
      },
    };

    // Act
    render(h(WorkspaceItem, transferringWorkspace));

    // Assert
    await screen.findByText('Christina test');
    await screen.findByText('Initial Transfer in Progress (1000 B/1.95 KiB)');
  });

  it('shows transfer to temp bucket state with no files', async () => {
    // Arrange
    const transferringWorkspace: WorkspaceMigrationInfo = {
      failureReason: undefined,
      finalBucketTransferProgress: {
        bytesTransferred: 0,
        objectsTransferred: 0,
        totalBytesToTransfer: 0,
        totalObjectsToTransfer: 0,
      },
      migrationStep: 'TransferringToTempBucket',
      name: 'Christina test',
      namespace: 'general-dev-billing-account',
      outcome: undefined,
      tempBucketTransferProgress: {
        bytesTransferred: 0,
        objectsTransferred: 0,
        totalBytesToTransfer: 0,
        totalObjectsToTransfer: 0,
      },
    };

    // Act
    render(h(WorkspaceItem, transferringWorkspace));

    // Assert
    await screen.findByText('Christina test');
    await screen.findByText('Initial Bucket Transfer');
  });

  it('shows transfer to temp bucket state with bytes', async () => {
    // Arrange
    const transferringWorkspace: WorkspaceMigrationInfo = {
      failureReason: undefined,
      finalBucketTransferProgress: {
        bytesTransferred: 1000,
        objectsTransferred: 2,
        totalBytesToTransfer: 2000,
        totalObjectsToTransfer: 4,
      },
      migrationStep: 'TransferringToFinalBucket',
      name: 'Christina test',
      namespace: 'general-dev-billing-account',
      outcome: undefined,
      tempBucketTransferProgress: {
        bytesTransferred: 2000,
        objectsTransferred: 4,
        totalBytesToTransfer: 2000,
        totalObjectsToTransfer: 4,
      },
    };

    // Act
    render(h(WorkspaceItem, transferringWorkspace));

    // Assert
    await screen.findByText('Christina test');
    await screen.findByText('Final Transfer in Progress (1000 B/1.95 KiB)');
  });

  it('shows transfer to temp bucket state with no files', async () => {
    // Arrange
    const transferringWorkspace: WorkspaceMigrationInfo = {
      failureReason: undefined,
      finalBucketTransferProgress: {
        bytesTransferred: 0,
        objectsTransferred: 0,
        totalBytesToTransfer: 0,
        totalObjectsToTransfer: 0,
      },
      migrationStep: 'TransferringToFinalBucket',
      name: 'Christina test',
      namespace: 'general-dev-billing-account',
      outcome: undefined,
      tempBucketTransferProgress: {
        bytesTransferred: 0,
        objectsTransferred: 0,
        totalBytesToTransfer: 0,
        totalObjectsToTransfer: 0,
      },
    };

    // Act
    render(h(WorkspaceItem, transferringWorkspace));

    // Assert
    await screen.findByText('Christina test');
    await screen.findByText('Final Bucket Transfer');
  });
});
