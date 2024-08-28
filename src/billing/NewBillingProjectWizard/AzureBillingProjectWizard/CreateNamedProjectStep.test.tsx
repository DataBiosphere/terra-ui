import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CreateNamedProjectStep } from 'src/billing/NewBillingProjectWizard/AzureBillingProjectWizard/CreateNamedProjectStep';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

// Exported for wizard integration test.
export const nameBillingProject = async (billingProjectName) => {
  await userEvent.click(getBillingProjectInput());
  fireEvent.change(getBillingProjectInput(), { target: { value: billingProjectName } });
};
export const clickCreateBillingProject = async () => {
  const createButton = getCreateButton();
  verifyEnabled(createButton);
  await userEvent.click(createButton);
};
export const verifyCreateBillingProjectDisabled = () => {
  verifyDisabled(getCreateButton());
};

const onBillingProjectNameChanged = jest.fn();
const onBillingProjectInputFocused = jest.fn();
const createBillingProject = jest.fn();
const getBillingProjectInput = () => screen.getByLabelText('Billing project name *');
const getCreateButton = () => screen.getByText('Create Terra Billing Project');
const uniqueBillingProjectNameMsg = 'Name must be unique and cannot be changed';
const verifyDisabled = (item) => expect(item).toHaveAttribute('disabled');
const verifyEnabled = (item) => expect(item).not.toHaveAttribute('disabled');

const defaultProps = {
  isActive: true,
  billingProjectName: 'TestProjectName',
  onBillingProjectNameChanged,
  onBillingProjectInputFocused,
  createBillingProject,
  projectNameErrors: undefined,
  createReady: false,
};

describe('CreateNamedProjectStep', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('has the correct initial state', () => {
    // Arrange
    render(<CreateNamedProjectStep {...defaultProps} />);

    // Assert
    verifyEnabled(getBillingProjectInput());
    // @ts-ignore
    expect(getBillingProjectInput().value).toBe(defaultProps.billingProjectName);
    expect(screen.queryByText(uniqueBillingProjectNameMsg)).not.toBeNull();
    expect(screen.queryByText('Learn more and follow changes')).not.toBeNull();
    expect(
      screen.queryByText('It may take up to 15 minutes for the billing project to be fully created and ready for use.')
    ).not.toBeNull();
    verifyCreateBillingProjectDisabled();
    expect(createBillingProject).not.toHaveBeenCalled();
  });

  it('shows errors about the billing project name', () => {
    // Arrange
    render(<CreateNamedProjectStep {...defaultProps} projectNameErrors='Bad project name' />);

    // Assert
    verifyEnabled(getBillingProjectInput());
    expect(screen.queryByText(uniqueBillingProjectNameMsg)).toBeNull();
    expect(screen.queryByText('Bad project name')).not.toBeNull();
  });

  it('fires an event when the billing project input is focused', async () => {
    // Arrange
    const user = userEvent.setup();

    render(<CreateNamedProjectStep {...defaultProps} />);

    // Act
    await user.click(getBillingProjectInput());

    // Assert
    expect(onBillingProjectInputFocused).toHaveBeenCalled();
    expect(onBillingProjectNameChanged).not.toHaveBeenCalled();
  });

  it('fires an event when the billing project name changes', async () => {
    // Arrange
    render(<CreateNamedProjectStep {...defaultProps} />);

    // Act
    await nameBillingProject('NewName');

    // Assert
    expect(onBillingProjectNameChanged).toHaveBeenCalledWith('NewName');
  });

  it('enables the create button and fires when it is clicked', async () => {
    // Arrange
    render(<CreateNamedProjectStep {...defaultProps} createReady />);

    // Act - Click Create
    await clickCreateBillingProject();

    // Assert
    expect(createBillingProject).toHaveBeenCalled();
  });
});
