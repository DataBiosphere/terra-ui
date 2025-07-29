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

    // Act
    render(
      h(CloudInformation, {
        workspace,
        storageDetails: {
          googleBucketLocation: '',
          googleBucketType: '',
          fetchedGoogleBucketLocation: undefined,
        },
      })
    );

    // Assert
    expect(screen.getByText('Cloud Name')).toBeInTheDocument();
    expect(screen.getByTitle('Google Cloud Platform')).toBeInTheDocument();
    expect(screen.getByText('Google Project ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Copy google project ID to clipboard')).toBeInTheDocument();
  });

  it('renders nothing for non-Google workspaces', async () => {
    // Arrange
    const workspace = { ...defaultAzureWorkspace, workspaceInitialized: true };

    // Act
    render(
      h(CloudInformation, {
        workspace,
        storageDetails: {
          googleBucketLocation: '',
          googleBucketType: '',
          fetchedGoogleBucketLocation: undefined,
        },
      })
    );

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
});
