import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as clipboard from 'clipboard-polyfill/text';
import { axe } from 'jest-axe';
import _ from 'lodash/fp';
import { dl, h } from 'react-hyperscript-helpers';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { azureRegions } from 'src/libs/azure-regions';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';
import {
  defaultAzureStorageOptions,
  defaultAzureWorkspace,
  defaultGoogleBucketOptions,
} from 'src/testing/workspace-fixtures';
import { AzureStorageDetails, AzureStorageDetailsProps } from 'src/workspaces/dashboard/AzureStorageDetails';

jest.mock('src/libs/ajax/Metrics');

type ClipboardPolyfillExports = typeof import('clipboard-polyfill/text');
jest.mock('clipboard-polyfill/text', (): ClipboardPolyfillExports => {
  const actual = jest.requireActual<ClipboardPolyfillExports>('clipboard-polyfill/text');
  return {
    ...actual,
    writeText: jest.fn().mockResolvedValue(undefined),
  };
});

describe('AzureStorageDetails', () => {
  const azureContext = {
    managedResourceGroupId: 'dummy-mrg-id',
    subscriptionId: 'dummy-subscription-id',
    tenantId: 'dummy-tenant-id',
  };

  const eventWorkspaceDetails = extractWorkspaceDetails(defaultAzureWorkspace);

  const azureStorageDetailsProps: AzureStorageDetailsProps = {
    azureContext,
    storageDetails: _.merge(defaultGoogleBucketOptions, {
      azureContainerRegion: 'westus',
      azureContainerUrl: 'only-container-url',
      azureContainerSasUrl: 'url-with-sas-token',
    }),
    eventWorkspaceDetails,
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows Loading initially when uninitialized and should not fail any accessibility tests', async () => {
    // Arrange
    const props = {
      azureContext,
      storageDetails: _.merge(defaultGoogleBucketOptions, defaultAzureStorageOptions),
      eventWorkspaceDetails,
    };

    // Act
    const { container } = render(dl([h(AzureStorageDetails, props)]));

    // Assert
    expect(screen.queryByTitle('Microsoft Azure')).not.toBeNull();
    expect(screen.getAllByText('dummy-mrg-id')).not.toBeNull();
    // (Location, Storage Container URL, Storage Container SAS) x 2 because of tooltips
    expect(screen.getAllByText('Loading').length).toEqual(6);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows storage information when present', async () => {
    // Act
    const { container } = render(dl([h(AzureStorageDetails, azureStorageDetailsProps)]));

    // Assert
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getAllByText(new RegExp(`${azureRegions.westus.label}`))).not.toBeNull();
    expect(screen.getAllByText(/🇺🇸/)).not.toBeNull();
    expect(screen.getAllByText(/only-container-url/)).not.toBeNull();
    expect(screen.getAllByText(/url-with-sas-token/)).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('emits an event when the copy resource group clipboard button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const captureEvent = jest.fn();
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));
    render(dl([h(AzureStorageDetails, azureStorageDetailsProps)]));

    // Act
    const copyResourceGroup = screen.getByLabelText('Copy resource group ID to clipboard');
    await user.click(copyResourceGroup);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(Events.workspaceDashboardCopyResourceGroup, eventWorkspaceDetails);
    expect(clipboard.writeText).toHaveBeenCalledWith(azureContext.managedResourceGroupId);
  });

  it('emits an event when the copy storage container URL clipboard button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const captureEvent = jest.fn();
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));

    render(dl([h(AzureStorageDetails, azureStorageDetailsProps)]));

    // Act
    const copyButton = screen.getByLabelText('Copy storage container URL to clipboard');
    await user.click(copyButton);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(Events.workspaceDashboardCopyStorageContainerUrl, eventWorkspaceDetails);
    expect(clipboard.writeText).toHaveBeenCalledWith(azureStorageDetailsProps.storageDetails.azureContainerUrl);
  });

  it('emits an event when the copy SAS URL clipboard button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const captureEvent = jest.fn();
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));

    render(dl([h(AzureStorageDetails, azureStorageDetailsProps)]));

    // Act
    const copyButton = screen.getByLabelText('Copy SAS URL to clipboard');
    await user.click(copyButton);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(Events.workspaceDashboardCopySASUrl, eventWorkspaceDetails);
    expect(clipboard.writeText).toHaveBeenCalledWith(azureStorageDetailsProps.storageDetails.azureContainerSasUrl);
  });
});
