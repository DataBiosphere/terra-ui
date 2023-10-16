import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { div, h, label } from 'react-hyperscript-helpers';
import { getRegionLabel } from 'src/libs/azure-utils';
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates';
import { ManagedApplicationSelect } from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/ManagedApplicationSelect';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

describe('ManagedApplicationSelect', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const allManagedApps: AzureManagedAppCoordinates[] = [
    {
      applicationDeploymentName: 'CARJune21',
      managedResourceGroupId: 'mrg-terra-dev-previ-20230621155520',
      subscriptionId: 'df547342-9cfd-44ef-a6dd-df0ede32f1e3',
      tenantId: 'fad90753-2022-4456-9b0a-c7e5b934e408',
      region: 'eastus',
    },
    {
      applicationDeploymentName: 'CARSep8SouthCentral',
      managedResourceGroupId: 'mrg-terra-dev-previ-20230908105016',
      subscriptionId: 'df547342-9cfd-44ef-a6dd-df0ede32f1e3',
      tenantId: 'fad90753-2022-4456-9b0a-c7e5b934e408',
      region: 'southcentralus',
    },
    {
      applicationDeploymentName: 'CARTestWithVeryLongMRGName',
      managedResourceGroupId: 'azure-featured-workspaces-managed-apps-20231013',
      subscriptionId: 'df547342-9cfd-44ef-a6dd-df0ede32f1e3',
      tenantId: 'fad90753-2022-4456-9b0a-c7e5b934e408',
      region: 'southcentralus',
    },
  ];

  const appDisplay = (app: AzureManagedAppCoordinates) =>
    `${app.applicationDeploymentName} (${getRegionLabel(app.region)})`;

  it('renders the correct item initially', async () => {
    render(
      div([
        label({ htmlFor: 'id' }, ['label text']),
        h(ManagedApplicationSelect, {
          id: 'id',
          isDisabled: true,
          value: allManagedApps[1],
          onChange: jest.fn(),
          allManagedApps,
        }),
      ])
    );

    // Falsy because the select is disabled.

    expect(screen.queryByRole('combobox')).toBeFalsy();

    // The item passed as value will be displayed in the select
    screen.getByText(appDisplay(allManagedApps[1]));
  });

  it('selects an enabled item', async () => {
    const onChangeCallback = jest.fn();
    render(
      div([
        label({ htmlFor: 'id' }, ['label text']),
        h(ManagedApplicationSelect, {
          id: 'id',
          isDisabled: false,
          value: allManagedApps[1],
          onChange: onChangeCallback,
          allManagedApps,
        }),
      ])
    );

    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    const selectOption = await screen.findByText(appDisplay(allManagedApps[0]));
    await userEvent.click(selectOption);
    // Option Deployment "CARJune21" in region "eastus" , focused
    expect(onChangeCallback).toBeCalledWith(allManagedApps[0]);
  });

  it('disables an mrg that is too long', async () => {
    const onChangeCallback = jest.fn();
    const { container } = render(
      div([
        label({ htmlFor: 'id' }, ['label text']),
        h(ManagedApplicationSelect, {
          id: 'id',
          isDisabled: false,
          value: allManagedApps[1],
          onChange: onChangeCallback,
          allManagedApps,
        }),
      ])
    );

    const select = screen.getByLabelText('label text');
    await userEvent.click(select);
    const selectOption = await screen.findByText(appDisplay(allManagedApps[2]));
    await userEvent.click(selectOption);
    expect(onChangeCallback).not.toBeCalled();

    const selectOptions = screen.getAllByRole('option');
    expect(selectOptions.length).toBe(3);
    expect(selectOptions[2]).toHaveAttribute('aria-disabled');

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent(
      'The Managed Resource Group name "azure-featured-workspaces-managed-apps-20231013" is 47 characters long. This exceeds the maximum allowed length of 35.'
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
