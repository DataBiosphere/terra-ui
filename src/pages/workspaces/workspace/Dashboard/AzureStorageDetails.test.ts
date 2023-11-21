import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import _ from 'lodash/fp';
import { dl, h } from 'react-hyperscript-helpers';
import { azureRegions } from 'src/libs/azure-regions';
import { AzureStorageDetails } from 'src/pages/workspaces/workspace/Dashboard/AzureStorageDetails';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureStorageOptions, defaultGoogleBucketOptions } from 'src/testing/workspace-fixtures';

describe('AzureStorageDetails', () => {
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
    const { container } = render(dl([h(AzureStorageDetails, props)]));

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
    const { container } = render(dl([h(AzureStorageDetails, props)]));

    // Assert
    expect(screen.queryByText('Loading')).toBeNull();
    expect(screen.getAllByText(new RegExp(`${azureRegions.westus.label}`))).not.toBeNull();
    expect(screen.getAllByText(/🇺🇸/)).not.toBeNull();
    expect(screen.getAllByText(/only-container-url/)).not.toBeNull();
    expect(screen.getAllByText(/url-with-sas-token/)).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
