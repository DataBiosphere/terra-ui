import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React from 'react';
import { Link } from 'src/components/common';
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
  regionConstraintPolicy,
} from 'src/testing/workspace-fixtures';
import {
  AzureWorkspace,
  groupConstraintLabel,
  phiTrackingLabel,
  protectedDataLabel,
  regionConstraintLabel,
} from 'src/workspaces/utils';
import { WorkspacePolicies } from 'src/workspaces/WorkspacePolicies/WorkspacePolicies';

describe('WorkspacePolicies', () => {
  const policyLabel = /This workspace has the following/;

  describe('handles a workspace as the source of the policies', () => {
    it('renders nothing if the policy array is empty', () => {
      // Act
      render(<WorkspacePolicies workspace={defaultAzureWorkspace} />);

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
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
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders policies with no accessibility errors', async () => {
      // Arrange. Render all policies to check for missing key errors.
      const workspaceWithAllPolicies: AzureWorkspace = {
        ...defaultAzureWorkspace,
        policies: [protectedDataPolicy, groupConstraintPolicy, regionConstraintPolicy],
      };

      // Act
      const { container } = render(<WorkspacePolicies workspace={workspaceWithAllPolicies} />);

      // Assert
      expect(await axe(container)).toHaveNoViolations();
      screen.getByText('This workspace has the following policies:');
      screen.getByText(protectedDataLabel);
      screen.getByText(groupConstraintLabel);
      screen.getByText(regionConstraintLabel);
    });
  });

  describe('handles a billing project as the source of the policies', () => {
    it('renders nothing for a GCP billing project', () => {
      // Act
      render(<WorkspacePolicies billingProject={gcpBillingProject} />);

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders nothing for an Azure unprotected billing project', () => {
      // Act
      render(<WorkspacePolicies billingProject={azureBillingProject} />);

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders policies for an Azure protected data billing project', async () => {
      // Act
      render(<WorkspacePolicies billingProject={azureProtectedDataBillingProject} />);

      // Assert
      screen.getByText(policyLabel);
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
      screen.getByText(policyLabel);
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
      screen.getByText(policyLabel);
      expect(screen.getAllByText(protectedDataLabel)).toHaveLength(1);
      screen.getByText(regionConstraintLabel);
    });

    it('renders nothing if workspace and billing project are undefined', () => {
      // Act
      render(<WorkspacePolicies />);

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });
  });

  describe('supports UI customization ', () => {
    it('allows passing a title and label about the list', async () => {
      // Act
      render(
        <WorkspacePolicies title="Test title" policiesLabel="About this list:" workspace={protectedAzureWorkspace} />
      );

      // Assert
      expect(screen.getAllByText('Test title')).not.toBeNull();
      expect(screen.getAllByText('About this list:')).not.toBeNull();
    });

    it('renders a link if provided', async () => {
      // Act
      render(
        <WorkspacePolicies
          workspace={protectedAzureWorkspace}
          policiesLink={<Link href="http://dummy-link">about policies</Link>}
        />
      );

      // Assert
      screen.getByText('about policies');
    });

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
      // Arrange. Include all policies to check for missing key errors.
      const workspaceWithAllPolicies: AzureWorkspace = {
        ...defaultAzureWorkspace,
        policies: [protectedDataPolicy, groupConstraintPolicy, regionConstraintPolicy],
      };

      // Act
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

    it('calls PHI tracking callback if provided', async () => {
      // Arrange
      const user = userEvent.setup();
      const phiTrackingCallback = jest.fn();

      // Act
      render(
        <WorkspacePolicies billingProject={azureProtectedDataBillingProject} togglePhiTracking={phiTrackingCallback} />
      );
      const phiCheckbox = screen.getByLabelText(phiTrackingLabel);
      await user.click(phiCheckbox);
      await user.click(phiCheckbox);

      // Assert
      expect(phiTrackingCallback).toHaveBeenNthCalledWith(1, true);
      expect(phiTrackingCallback).toHaveBeenNthCalledWith(2, false);
    });
  });
});
