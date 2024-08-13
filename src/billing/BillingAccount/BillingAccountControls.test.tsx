import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { hasBillingScope } from 'src/auth/auth';
import { BillingAccountControls } from 'src/billing/BillingAccount/BillingAccountControls';
import { GCPBillingProject } from 'src/libs/ajax/Billing';
import { gcpBillingProject } from 'src/testing/billing-project-fixtures';
import { asMockedFn, renderWithAppContexts } from 'src/testing/test-utils';

// type AjaxContract = ReturnType<typeof Ajax>;
// jest.mock('src/libs/ajax');

type AuthExports = typeof import('src/auth/auth');
jest.mock('src/auth/auth', (): AuthExports => {
  const originalModule = jest.requireActual<AuthExports>('src/auth/auth');
  return {
    ...originalModule,
    hasBillingScope: jest.fn(),
  };
});

describe('BillingAccountControls', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    asMockedFn(hasBillingScope).mockReturnValue(true);
  });

  // const select90Days = async () => {
  //   // Selecting the option by all the "usual" methods of supplying label text, selecting an option, etc. failed.
  //   // Perhaps this is because these options have both display text and a value?
  //   // Unfortunately this awkward approach was the only thing that appeared to work.
  //   const getDateRangeSelect = screen.getByLabelText('Date range');
  //   // 7 days
  //   fireEvent.keyDown(getDateRangeSelect, { key: 'ArrowDown', code: 'ArrowDown' });
  //   // 30 days
  //   fireEvent.keyDown(getDateRangeSelect, { key: 'ArrowDown', code: 'ArrowDown' });
  //   // 90 days
  //   fireEvent.keyDown(getDateRangeSelect, { key: 'ArrowDown', code: 'ArrowDown' });
  //   // Choose the current focused option.
  //   await act(async () => {
  //     fireEvent.keyDown(getDateRangeSelect, { key: 'Enter', code: 'Enter' });
  //   });
  //
  //   await waitFor(() => {
  //     // Check that 90 days was actually selected. There will always be a DOM element present with
  //     // text "Last 90 days", but if it is the selected element (which means the option dropdown has closed),
  //     // it will have a class name ending in "singleValue". This is ugly, but the Select component we are
  //     // using does not set the value on the input element itself.
  //     expect(screen.getByText('Last 90 days').className).toContain('singleValue');
  //   });
  // };

  // interface BillingAccountControlsProps {
  //   authorizeAndLoadAccounts: any;
  //   billingAccounts: Record<string, GoogleBillingAccount>;
  //   billingProject: GCPBillingProject;
  //   isOwner: boolean;
  //   getShowBillingModal: () => boolean;
  //   setShowBillingModal: (v: boolean) => void;
  //   reloadBillingProject: () => void;
  //   setUpdating: (v: boolean) => void;
  // }

  it('displays a link to view billing account info if user does not have billing scope', async () => {
    // Arrange
    // const getSpendReport = jest.fn();
    // asMockedFn(Ajax).mockImplementation(
    //     () =>
    //         ({
    //           Billing: { getSpendReport } as Partial<AjaxContract['Billing']>,
    //         } as Partial<AjaxContract> as AjaxContract)
    // );
    // getSpendReport.mockResolvedValue(createSpendReportResult('1110'));
    // Arrange
    const user = userEvent.setup();
    asMockedFn(hasBillingScope).mockReturnValue(false);
    const mockAuthorizeAndLoadAccounts = jest.fn();
    // Act
    renderWithAppContexts(
      <BillingAccountControls
        authorizeAndLoadAccounts={mockAuthorizeAndLoadAccounts}
        billingAccounts={{}}
        billingProject={gcpBillingProject}
        isOwner
        getShowBillingModal={() => false}
        setShowBillingModal={jest.fn()}
        reloadBillingProject={jest.fn()}
        setUpdating={jest.fn()}
      />
    );

    // Assert
    const addUserButton = screen.getByText('View billing account');
    await user.click(addUserButton);
    expect(mockAuthorizeAndLoadAccounts).toHaveBeenCalled();
  });

  it('shows no billing account message if user has billing scope but billing project does not have an account', async () => {
    // Historical case noted with comment in code, not sure if it actually exists anymore.
    const billingProjectWithNoAccount: GCPBillingProject = {
      // @ts-ignore
      billingAccount: null,
      cloudPlatform: 'GCP',
      invalidBillingAccount: false,
      projectName: 'Google Billing Project',
      roles: ['Owner'],
      status: 'Ready',
    };
    // Act
    renderWithAppContexts(
      <BillingAccountControls
        authorizeAndLoadAccounts={jest.fn()}
        billingAccounts={{}}
        billingProject={billingProjectWithNoAccount}
        isOwner={false}
        getShowBillingModal={() => false}
        setShowBillingModal={jest.fn()}
        reloadBillingProject={jest.fn()}
        setUpdating={jest.fn()}
      />
    );

    // Assert
    expect(screen.queryByText('View billing account')).toBeNull();
    screen.getByText('No linked billing account');
  });
});
