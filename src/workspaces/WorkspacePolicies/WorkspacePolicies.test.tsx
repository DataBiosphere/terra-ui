import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React from 'react';
import {
  azureBillingProject,
  azureProtectedDataBillingProject,
  gcpBillingProject,
} from 'src/testing/billing-project-fixtures';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import {
  defaultAzureWorkspace,
  groupConstraintPolicy,
  protectedAzureWorkspace,
  protectedDataPolicy,
  protectedGoogleWorkspace,
  regionConstraintPolicy,
} from 'src/testing/workspace-fixtures';
import {
  AzureWorkspace,
  groupConstraintLabel,
  phiTrackingLabel,
  phiTrackingPolicy,
  protectedDataLabel,
  regionConstraintLabel,
} from 'src/workspaces/utils';
import { WorkspacePolicies } from 'src/workspaces/WorkspacePolicies/WorkspacePolicies';

describe('WorkspacePolicies', () => {
  const policyTitle = 'Security and controls on this workspace:';

  const workspaceWithAllPolicies: AzureWorkspace = {
    ...defaultAzureWorkspace,
    policies: [protectedDataPolicy, groupConstraintPolicy, regionConstraintPolicy, phiTrackingPolicy],
  };

  describe('handles a workspace as the source of the policies', () => {
    it('renders nothing if the policy array is empty', () => {
      // Act
      render(<WorkspacePolicies workspace={defaultAzureWorkspace} />);

      // Assert
      expect(screen.queryByText(policyTitle)).toBeNull();
    });

    it('renders nothing if the workspace does not have known policies', () => {
      // Arrange
      const nonProtectedAzureWorkspace: AzureWorkspace = {
        ...defaultAzureWorkspace,
        policies: [
          {
            additionalData: [],
            namespace: 'terra',
            name: 'some-other-policy',
          },
        ],
      };

      // Act
      render(<WorkspacePolicies workspace={nonProtectedAzureWorkspace} />);

      // Assert
      expect(screen.queryByText(policyTitle)).toBeNull();
    });

    it('renders policies with no accessibility errors', async () => {
      // Act
      const { container } = render(<WorkspacePolicies workspace={workspaceWithAllPolicies} />);

      // Assert
      expect(await axe(container)).toHaveNoViolations();
      screen.getByText(policyTitle);
      screen.getByText(protectedDataLabel);
      screen.getByText(groupConstraintLabel);
      screen.getByText(regionConstraintLabel);
      screen.getByText(phiTrackingLabel);
    });
  });

  describe('handles a billing project as the source of the policies', () => {
    it('renders nothing for a GCP billing project', () => {
      // Act
      render(<WorkspacePolicies billingProject={gcpBillingProject} />);

      // Assert
      expect(screen.queryByText(policyTitle)).toBeNull();
    });

    it('renders nothing for an Azure unprotected billing project', () => {
      // Act
      render(<WorkspacePolicies billingProject={azureBillingProject} />);

      // Assert
      expect(screen.queryByText(policyTitle)).toBeNull();
    });

    it('renders policies for an Azure protected data billing project', async () => {
      // Act
      render(<WorkspacePolicies billingProject={azureProtectedDataBillingProject} />);

      // Assert
      screen.getByText(policyTitle);
      screen.getByText(protectedDataLabel);
    });
  });

  describe('handles both a workspace and a billing project ', () => {
    it('combines together policy information from workspace and billingProject', async () => {
      // Act
      const workspaceWithPolicies: AzureWorkspace = {
        ...defaultAzureWorkspace,
        policies: [regionConstraintPolicy],
      };
      render(<WorkspacePolicies billingProject={azureProtectedDataBillingProject} workspace={workspaceWithPolicies} />);

      // Assert
      screen.getByText(policyTitle);
      screen.getByText(protectedDataLabel);
      screen.getByText(regionConstraintLabel);
    });

    it('removes duplicate policy information', async () => {
      // Act
      const workspaceWithPolicies: AzureWorkspace = {
        ...defaultAzureWorkspace,
        policies: [protectedDataPolicy, regionConstraintPolicy],
      };
      render(<WorkspacePolicies billingProject={azureProtectedDataBillingProject} workspace={workspaceWithPolicies} />);

      // Assert
      screen.getByText(policyTitle);
      expect(screen.getAllByText(protectedDataLabel)).toHaveLength(1);
      screen.getByText(regionConstraintLabel);
    });

    it('renders nothing if workspace and billing project are undefined', () => {
      // Act
      render(<WorkspacePolicies />);

      // Assert
      expect(screen.queryByText(policyTitle)).toBeNull();
    });
  });

  describe('displays general information about security/policies', () => {
    const policyLinkText = 'Learn more about Terra security';
    const azurePolicyHref = '21329019108635-Host-FISMA-data-on-FedRAMP-moderate-Terra-Azure';

    it('renders a title', async () => {
      // Act
      render(<WorkspacePolicies workspace={protectedAzureWorkspace} />);

      // Assert
      expect(screen.getAllByText('Security and controls on this workspace:')).not.toBeNull();
    });

    it('renders a link with Azure security information for Azure billing projects', async () => {
      // Act
      render(<WorkspacePolicies billingProject={azureProtectedDataBillingProject} />);

      // Assert
      const link = screen.getByRole('link', { name: policyLinkText });
      expect(link.getAttribute('href')).toContain(azurePolicyHref);
    });

    it('renders a link with Azure security information for Azure workspaces', async () => {
      // Act
      render(<WorkspacePolicies workspace={protectedAzureWorkspace} />);

      // Assert
      const link = screen.getByRole('link', { name: policyLinkText });
      expect(link.getAttribute('href')).toContain(azurePolicyHref);
    });

    it('renders a link with auth domain information for Gcp protected workspaces', async () => {
      // Act
      render(<WorkspacePolicies workspace={protectedGoogleWorkspace} />);

      // Assert
      const link = screen.getByRole('link', { name: policyLinkText });
      expect(link.getAttribute('href')).toContain(
        '360026775691-Overview-Managing-access-to-controlled-data-with-Authorization-Domains'
      );
    });
  });

  describe('supports UI customization ', () => {
    it('renders an ending notice if provided', async () => {
      // Act
      render(<WorkspacePolicies workspace={protectedAzureWorkspace} endingNotice={<div>ending notice</div>} />);

      // Assert
      screen.getByText('ending notice');
    });

    it('renders policies as disabled checkbox controls by default', async () => {
      // Act
      render(<WorkspacePolicies billingProject={azureProtectedDataBillingProject} />);

      // Assert
      const checkbox = screen.getByLabelText(protectedDataLabel);
      expect(checkbox).toHaveAttribute('disabled');
      expect(checkbox).toHaveAttribute('role', 'checkbox');
    });

    it('supports rendering policies with a check icon instead of a checkbox', async () => {
      // Act. Include all policies to check for missing key errors.
      render(<WorkspacePolicies workspace={workspaceWithAllPolicies} noCheckboxes />);

      // Assert
      expect(screen.queryByLabelText(protectedDataLabel)).toBeNull();
      expect(screen.queryByRole('checkbox')).toBeNull();
      screen.getByText(protectedDataLabel);
    });
  });

  describe('supports toggling PHI tracking ', () => {
    it('does not provide PHI tracking control by default', async () => {
      // Act
      render(<WorkspacePolicies billingProject={azureProtectedDataBillingProject} />);

      // Assert
      expect(screen.queryByText(phiTrackingLabel)).toBeNull();
    });

    it('checks PHI tracking control if passed value', async () => {
      // Act
      render(
        <WorkspacePolicies
          billingProject={azureProtectedDataBillingProject}
          onTogglePhiTracking={jest.fn()}
          togglePhiTrackingChecked
        />
      );
      const phiCheckbox = screen.getByLabelText(phiTrackingLabel);

      // Assert
      expect(phiCheckbox).toBeChecked();
    });

    it('calls PHI tracking callback if provided', async () => {
      // Arrange
      const user = userEvent.setup();
      const phiTrackingCallback = jest.fn();

      // Act
      render(
        <WorkspacePolicies
          billingProject={azureProtectedDataBillingProject}
          onTogglePhiTracking={phiTrackingCallback}
        />
      );
      const phiCheckbox = screen.getByLabelText(phiTrackingLabel);
      expect(phiCheckbox).not.toBeChecked();
      await user.click(phiCheckbox);
      await user.click(phiCheckbox);

      // Assert
      expect(phiTrackingCallback).toHaveBeenNthCalledWith(1, true);
      expect(phiTrackingCallback).toHaveBeenNthCalledWith(2, false);
    });
  });
});
