import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { Ajax, AjaxContract } from 'src/libs/ajax';
import { WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import {
  defaultAzureStorageOptions,
  defaultGoogleBucketOptions,
  defaultGoogleWorkspace,
  mockBucketRequesterPaysError,
} from 'src/testing/workspace-fixtures';
import { BucketLocation } from 'src/workspaces/dashboard/BucketLocation';
import { GoogleWorkspace } from 'src/workspaces/utils';

jest.mock('src/libs/ajax');

jest.mock('src/libs/notifications');

// Needed for bringing up the RequestPays modal
type WorkspaceProviderExports = typeof import('src/libs/ajax/workspaces/providers/WorkspaceProvider');
jest.mock(
  'src/libs/ajax/workspaces/providers/WorkspaceProvider',
  (): WorkspaceProviderExports => ({
    workspaceProvider: {
      list: jest.fn(),
    },
  })
);

describe('BucketLocation', () => {
  const workspace: GoogleWorkspace & { workspaceInitialized: boolean } = {
    ...defaultGoogleWorkspace,
    workspace: {
      ...defaultGoogleWorkspace.workspace,
      namespace: 'test',
      name: 'test',
      cloudPlatform: 'Gcp',
    },
    workspaceInitialized: true,
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows Loading initially when uninitialized and should not fail any accessibility tests', async () => {
    // Arrange
    const props = {
      workspace: _.merge(workspace, { workspaceInitialized: false }),
      storageDetails: _.merge(defaultGoogleBucketOptions, defaultAzureStorageOptions),
    };

    // Act
    const { container } = render(h(BucketLocation, props));

    // Assert
    expect(screen.queryByText('Loading')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows Loading initially when initialized', () => {
    // Arrange
    const props = {
      workspace,
      storageDetails: _.merge(defaultGoogleBucketOptions, defaultAzureStorageOptions),
    };

    // Act
    render(h(BucketLocation, props));

    // Assert
    expect(screen.queryByText('Loading')).not.toBeNull();
  });

  it('renders the bucket location if available, and has no accessibility errors', async () => {
    // Arrange
    const props = {
      workspace,
      storageDetails: _.mergeAll([
        defaultGoogleBucketOptions,
        { fetchedGoogleBucketLocation: 'SUCCESS' },
        defaultAzureStorageOptions,
      ]),
    };

    // Act
    const { container } = render(h(BucketLocation, props));

    // Assert
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getAllByText(/Iowa/)).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('fetches the bucket location if workspaceContainer attempt encountered an error', async () => {
    // Arrange
    const props = {
      workspace,
      storageDetails: _.mergeAll([
        defaultGoogleBucketOptions,
        { fetchedGoogleBucketLocation: 'ERROR' },
        defaultAzureStorageOptions,
      ]),
    };
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Workspaces: {
            workspace: () =>
              ({
                checkBucketLocation: jest.fn().mockResolvedValue({
                  location: 'bermuda',
                  locationType: 'triangle',
                }),
              } as Partial<ReturnType<WorkspacesAjaxContract['workspace']>>),
          } as Partial<WorkspacesAjaxContract>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    // Act
    await act(async () => { render(h(BucketLocation, props)) }) //eslint-disable-line

    // Assert
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getAllByText(/bermuda/)).not.toBeNull();
  });

  it('handles requester pays error', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = {
      workspace,
      storageDetails: _.mergeAll([
        defaultGoogleBucketOptions,
        { fetchedGoogleBucketLocation: 'ERROR' },
        defaultAzureStorageOptions,
      ]),
    };
    const captureEvent = jest.fn();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
          Workspaces: {
            workspace: () =>
              ({
                checkBucketLocation: () => Promise.reject(mockBucketRequesterPaysError),
              } as Partial<ReturnType<WorkspacesAjaxContract['workspace']>>),
          } as Partial<WorkspacesAjaxContract>,
        } as Partial<AjaxContract> as AjaxContract)
    );
    // Act
    await act(async () => { render(h(BucketLocation, props)) }) //eslint-disable-line

    // Assert
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getAllByText(/bucket is requester pays/)).not.toBeNull();

    // Act
    const loadBucketLocation = screen.getByLabelText('Load bucket location');
    await user.click(loadBucketLocation);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(
      Events.workspaceDashboardBucketRequesterPays,
      extractWorkspaceDetails(workspace)
    );
    // In the RequesterPays modal (because the list method returns no workspaces).
    expect(screen.getAllByText('Go to Workspaces')).not.toBeNull();
  });
});
