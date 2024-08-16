import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React from 'react';
import { BillingAccountSummary } from 'src/billing/BillingAccount/BillingAccountSummary';
import { contactUsActive } from 'src/libs/state';
import { renderWithAppContexts } from 'src/testing/test-utils';

describe('BillingAccountSummary', () => {
  it('renders all account statuses with numbers and no accessibility issues', async () => {
    // Act
    const { container } = renderWithAppContexts(<BillingAccountSummary done={2} updating={3} error={1} />);

    // Assert
    // getByText throws an exception if the text is not present.
    screen.getByText('Your billing account is updating...');
    screen.getByText('done (2)');
    screen.getByText('updating (3)');
    screen.getByText('error (1)');
    screen.getByText('contact us regarding unresolved errors');
    // Verify accessibility
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not render a support link if there are no errors', () => {
    // Act
    renderWithAppContexts(<BillingAccountSummary done={2} updating={3} error={0} />);

    // Assert
    // getByText throws an exception if the text is not present.
    screen.getByText('Your billing account is updating...');
    expect(screen.queryByText('error (0)')).toBeNull();
    expect(screen.queryByText('contact us regarding unresolved errors')).toBeNull();
  });

  it('shows the customer support modal if link is clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    renderWithAppContexts(<BillingAccountSummary done={2} updating={3} error={1} />);
    expect(contactUsActive.get()).toBeFalsy();
    const supportLink = screen.getByText('contact us regarding unresolved errors');
    await user.click(supportLink);

    // Assert
    expect(contactUsActive.get()).toBeTruthy();
  });
});
