import { groupByBillingAccountStatus } from 'src/billing/Project';
import { GCPBillingProject, GoogleBillingAccount } from 'src/libs/ajax/Billing';
import { azureBillingProject, gcpBillingProject } from 'src/testing/billing-project-fixtures';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

describe('groupByBillingAccountStatus', () => {
  it('returns an empty mapping if there are no workspaces', () => {
    // Act
    const result = groupByBillingAccountStatus(gcpBillingProject, []);

    // Assert
    expect(result).toEqual({});
  });

  it('groups Azure workspaces as done', () => {
    // Act
    const result = groupByBillingAccountStatus(azureBillingProject, [defaultAzureWorkspace.workspace]);

    // Assert
    expect(result).toEqual({ done: new Set([defaultAzureWorkspace.workspace]) });
  });

  it('groups workspaces with matching billing account as done', () => {
    // Arrange
    const testBillingAccount: GoogleBillingAccount = {
      accountName: defaultGoogleWorkspace.workspace.billingAccount,
      displayName: 'Test Billing Account',
    };
    const googleBillingProject: GCPBillingProject = {
      billingAccount: testBillingAccount.accountName,
      cloudPlatform: 'GCP',
      invalidBillingAccount: false,
      projectName: 'Google Billing Project',
      roles: ['Owner'],
      status: 'Ready',
    };
    // Act
    const result = groupByBillingAccountStatus(googleBillingProject, [defaultGoogleWorkspace.workspace]);

    // Assert
    expect(result).toEqual({ done: new Set([defaultGoogleWorkspace.workspace]) });
  });

  it('groups workspaces without matching billing account and no errorMessage as updating', () => {
    // Arrange
    const googleBillingProject: GCPBillingProject = {
      billingAccount: 'billingAccounts/does-not-match',
      cloudPlatform: 'GCP',
      invalidBillingAccount: false,
      projectName: 'Google Billing Project',
      roles: ['Owner'],
      status: 'Ready',
    };
    // Act
    const result = groupByBillingAccountStatus(googleBillingProject, [defaultGoogleWorkspace.workspace]);

    // Assert
    expect(result).toEqual({ updating: new Set([defaultGoogleWorkspace.workspace]) });
  });

  it('groups workspaces without matching billing account and errorMessage as error', () => {
    // Arrange
    const googleBillingProject: GCPBillingProject = {
      billingAccount: 'billingAccounts/does-not-match',
      cloudPlatform: 'GCP',
      invalidBillingAccount: false,
      projectName: 'Google Billing Project',
      roles: ['Owner'],
      status: 'Ready',
    };
    const workspace = { ...defaultGoogleWorkspace.workspace, errorMessage: 'billing error message' };
    // Act
    const result = groupByBillingAccountStatus(googleBillingProject, [workspace]);

    // Assert
    expect(result).toEqual({ error: new Set([workspace]) });
  });

  it('can group multiple workspaces of the same type', () => {
    // Arrange
    const googleBillingProject: GCPBillingProject = {
      billingAccount: 'billingAccounts/does-not-match',
      cloudPlatform: 'GCP',
      invalidBillingAccount: false,
      projectName: 'Google Billing Project',
      roles: ['Owner'],
      status: 'Ready',
    };
    const firstWorkspace = { ...defaultGoogleWorkspace.workspace, errorMessage: 'billing error message' };
    const secondWorkspace = {
      ...defaultGoogleWorkspace.workspace,
      name: 'secondWorkspace',
      errorMessage: 'billing error message 2',
    };
    const updatingWorkspace = { ...defaultGoogleWorkspace.workspace, name: 'updatingWorkspace' };
    const secondUpdatingWorkspace = { ...defaultGoogleWorkspace.workspace, name: 'secondUpdatingWorkspace' };
    // Act
    const result = groupByBillingAccountStatus(googleBillingProject, [
      firstWorkspace,
      secondWorkspace,
      updatingWorkspace,
      secondUpdatingWorkspace,
    ]);

    // Assert
    expect(result).toEqual({
      error: new Set([firstWorkspace, secondWorkspace]),
      updating: new Set([updatingWorkspace, secondUpdatingWorkspace]),
    });
  });
});
