import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';
import { h } from 'react-hyperscript-helpers';
import { locationTypes } from 'src/components/region-common';
import { Ajax } from 'src/libs/ajax';
import { authStore } from 'src/libs/state';
import { defaultLocation } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';
import { AzureStorageDetails, BucketLocation, WorkspaceNotifications } from 'src/pages/workspaces/workspace/Dashboard';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');

jest.mock('src/libs/notifications');

describe('WorkspaceNotifications', () => {
  const testWorkspace = { workspace: { namespace: 'test', name: 'test' } };

  afterEach(() => {
    authStore.reset();
    jest.resetAllMocks();
  });

  it.each([
    {
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'true',
        'notifications/FailedSubmissionNotification/test/test': 'true',
        'notifications/AbortedSubmissionNotification/test/test': 'true',
      },
      expectedState: true,
    },
    {
      profile: {},
      expectedState: true,
    },
    {
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false',
      },
      expectedState: false,
    },
  ])('renders checkbox with submission notifications status', ({ profile, expectedState }) => {
    authStore.set({ profile });

    const { getByLabelText } = render(h(WorkspaceNotifications, { workspace: testWorkspace }));
    const submissionNotificationsCheckbox = getByLabelText('Receive submission notifications');
    expect(submissionNotificationsCheckbox.getAttribute('aria-checked')).toBe(`${expectedState}`);
  });

  it('updates preferences when checkbox is clicked', async () => {
    const user = userEvent.setup();

    const setPreferences = jest.fn().mockReturnValue(Promise.resolve());
    Ajax.mockImplementation(() => ({
      Metrics: {
        captureEvent: jest.fn(),
      },
      User: {
        profile: {
          get: jest.fn().mockReturnValue(Promise.resolve({ keyValuePairs: [] })),
          setPreferences,
        },
      },
    }));

    authStore.set({
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false',
      },
    });

    const { getByLabelText } = render(h(WorkspaceNotifications, { workspace: testWorkspace }));
    const submissionNotificationsCheckbox = getByLabelText('Receive submission notifications');

    await act(() => user.click(submissionNotificationsCheckbox));
    expect(setPreferences).toHaveBeenCalledWith({
      'notifications/SuccessfulSubmissionNotification/test/test': 'true',
      'notifications/FailedSubmissionNotification/test/test': 'true',
      'notifications/AbortedSubmissionNotification/test/test': 'true',
    });
  });

  it('has no accessibility errors', async () => {
    authStore.set({
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false',
      },
    });

    const { container } = render(h(WorkspaceNotifications, { workspace: testWorkspace }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

const defaultGoogleBucketOptions = {
  googleBucketLocation: defaultLocation,
  googleBucketType: locationTypes.default,
  fetchedGoogleBucketLocation: undefined,
};
const defaultAzureStorageOptions = {
  azureContainerRegion: undefined,
  azureContainerUrl: undefined,
  azureContainerSasUrl: undefined,
};

describe('BucketLocation', () => {
  const workspace = { workspace: { namespace: 'test', name: 'test', cloudPlatform: 'Gcp' }, workspaceInitialized: true };

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
      storageDetails: _.mergeAll([defaultGoogleBucketOptions, { fetchedGoogleBucketLocation: 'SUCCESS' }, defaultAzureStorageOptions]),
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
      storageDetails: _.mergeAll([defaultGoogleBucketOptions, { fetchedGoogleBucketLocation: 'ERROR' }, defaultAzureStorageOptions]),
    };
    const mockAjax = {
      Workspaces: {
        workspace: () => ({
          checkBucketLocation: jest.fn().mockResolvedValue({
            location: 'bermuda',
            locationType: 'triangle',
          }),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax);

    // Act
    await act(async () => { render(h(BucketLocation, props)) }) //eslint-disable-line

    // Assert
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getAllByText(/bermuda/)).not.toBeNull();
  });

  it('handles requester pays error', async () => {
    // Arrange
    const props = {
      workspace,
      storageDetails: _.mergeAll([defaultGoogleBucketOptions, { fetchedGoogleBucketLocation: 'ERROR' }, defaultAzureStorageOptions]),
    };
    const requesterPaysError = new Error('Requester pays bucket');
    requesterPaysError.requesterPaysError = true;
    const mockAjax = {
      Workspaces: {
        workspace: () => ({
          checkBucketLocation: () => Promise.reject(requesterPaysError),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax);

    // Act
    await act(async () => { render(h(BucketLocation, props)) }) //eslint-disable-line

    // Assert
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getAllByText(/bucket is requester pays/)).not.toBeNull();
  });
});

describe('AzureDetails', () => {
  const azureContext = {
    managedResourceGroupId: 'dummy-mrg-id',
    subscriptionId: 'dummy-subscription-id',
    tenantId: 'dummy-tenant-id',
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows Loading initially when uninitialized and should not fail any accessibility tests', async () => {
    // Arrange
    const props = {
      azureContext,
      storageDetails: _.merge(defaultGoogleBucketOptions, defaultAzureStorageOptions),
    };

    // Act
    const { container } = render(h(AzureStorageDetails, props), { container: document.body.appendChild(document.createElement('dl')) });

    // Assert
    expect(screen.queryByTitle('Microsoft Azure')).not.toBeNull();
    expect(screen.getAllByText('dummy-mrg-id')).not.toBeNull();
    // (Location, Storage Container URL, Storage Container SAS) x 2 because of tooltips
    expect(screen.getAllByText('Loading').length).toEqual(6);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows storage information when present', async () => {
    // Arrange
    const props = {
      azureContext,
      storageDetails: _.merge(defaultGoogleBucketOptions, {
        azureContainerRegion: 'westus',
        azureContainerUrl: 'only-container-url',
        azureContainerSasUrl: 'url-with-sas-token',
      }),
    };

    // Act
    const { container } = render(h(AzureStorageDetails, props), { container: document.body.appendChild(document.createElement('dl')) });

    // Assert
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getAllByText(/West US/)).not.toBeNull();
    expect(screen.getAllByText(/🇺🇸/)).not.toBeNull();
    expect(screen.getAllByText(/only-container-url/)).not.toBeNull();
    expect(screen.getAllByText(/url-with-sas-token/)).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
