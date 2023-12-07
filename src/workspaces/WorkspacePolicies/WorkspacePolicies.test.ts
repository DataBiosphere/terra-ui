import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import {
  AzureWorkspace,
  groupConstraintLabel,
  protectedDataLabel,
  protectedDataMessage,
  regionConstraintLabel,
} from 'src/libs/workspace-utils';
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
import { WorkspacePolicies } from 'src/workspaces/WorkspacePolicies/WorkspacePolicies';

describe('WorkspacePolicies', () => {
  const policyLabel = /This workspace has the following/;

  describe('handles a workspace as the source of the policies', () => {
    it('renders nothing if the policy array is empty', () => {
      // Act
      render(
        h(WorkspacePolicies, {
          workspace: defaultAzureWorkspace,
        })
      );

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
      render(
        h(WorkspacePolicies, {
          workspace: nonProtectedAzureWorkspace,
        })
      );

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders policies with no accessibility errors', async () => {
      // Arrange
      const workspaceWithAllPolicies: AzureWorkspace = {
        ...defaultAzureWorkspace,
        policies: [protectedDataPolicy, groupConstraintPolicy, regionConstraintPolicy],
      };

      // Act
      const { container } = render(
        h(WorkspacePolicies, {
          workspace: workspaceWithAllPolicies,
        })
      );

      // Assert
      expect(await axe(container)).toHaveNoViolations();
      screen.getByText('This workspace has the following policies:');
      screen.getByText(protectedDataLabel);
      screen.getByText(groupConstraintLabel);
      screen.getByText(regionConstraintLabel);
    });

    it('renders a tooltip', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        h(WorkspacePolicies, {
          workspace: protectedAzureWorkspace,
        })
      );

      // Act, click on the info button to get tooltip text to render.
      await user.click(screen.getByLabelText('More info'));

      // Assert
      expect(screen.getAllByText(protectedDataMessage)).not.toBeNull();
    });
  });

  describe('handles a billing project as the source of the policies', () => {
    it('renders nothing for a GCP billing project', () => {
      // Act
      render(
        h(WorkspacePolicies, {
          billingProject: gcpBillingProject,
        })
      );

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders nothing for an Azure unprotected billing project', () => {
      // Act
      render(
        h(WorkspacePolicies, {
          billingProject: azureBillingProject,
        })
      );

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders policies for an Azure protected data billing project', async () => {
      // Act
      render(
        h(WorkspacePolicies, {
          billingProject: azureProtectedDataBillingProject,
        })
      );

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
      render(
        h(WorkspacePolicies, {
          billingProject: azureProtectedDataBillingProject,
          workspace: workspaceWithPolicies,
        })
      );

      // Assert
      screen.getByText(policyLabel);
      expect(screen.getAllByText(protectedDataLabel)).toHaveLength(1);
      screen.getByText(regionConstraintLabel);
    });

    it('removes duplicate policy information', async () => {
      // Act
      const workspaceWithPolicies: AzureWorkspace = {
        ...defaultAzureWorkspace,
        policies: [protectedDataPolicy, regionConstraintPolicy],
      };
      render(
        h(WorkspacePolicies, {
          billingProject: azureProtectedDataBillingProject,
          workspace: workspaceWithPolicies,
        })
      );

      // Assert
      screen.getByText(policyLabel);
      expect(screen.getAllByText(protectedDataLabel)).toHaveLength(1);
      screen.getByText(regionConstraintLabel);
    });

    it('renders nothing if workspace and billing project are undefined', () => {
      // Act
      render(h(WorkspacePolicies, {}));

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });
  });

  it('allows passing a title and label about the list', async () => {
    // Act
    render(
      h(WorkspacePolicies, {
        title: 'Test title',
        policiesLabel: 'About this list:',
        workspace: protectedAzureWorkspace,
      })
    );

    // Assert
    expect(screen.getAllByText('Test title')).not.toBeNull();
    expect(screen.getAllByText('About this list:')).not.toBeNull();
  });
});
