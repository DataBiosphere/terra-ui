import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { AzureWorkspace } from 'src/libs/workspace-utils';
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
          policySource: defaultAzureWorkspace,
        })
      );

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders nothing if the policy array does not contain known policies', () => {
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
          policySource: nonProtectedAzureWorkspace,
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
          policySource: workspaceWithAllPolicies,
        })
      );

      // Assert
      expect(await axe(container)).toHaveNoViolations();
      expect(screen.getByText('This workspace has the following policies:')).toBeInTheDocument();
      screen.getByText('Additional security monitoring');
      screen.getByText('Data access controls');
      screen.getByText('Region constraint');
    });

    it('renders a tooltip', async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        h(WorkspacePolicies, {
          policySource: protectedAzureWorkspace,
        })
      );

      // Act, click on the info button to get tooltip text to render.
      await user.click(screen.getByLabelText('More info'));

      // Assert
      expect(screen.getAllByText(policyLabel)).not.toBeNull();
    });
  });

  describe('handles a billing project as the source of the policies', () => {
    it('renders nothing for a GCP billing project', () => {
      // Act
      render(
        h(WorkspacePolicies, {
          policySource: gcpBillingProject,
        })
      );

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders nothing for an Azure unprotected billing project', () => {
      // Act
      render(
        h(WorkspacePolicies, {
          policySource: azureBillingProject,
        })
      );

      // Assert
      expect(screen.queryByText(policyLabel)).toBeNull();
    });

    it('renders policies for an Azure protected data billing project', async () => {
      // Act
      render(
        h(WorkspacePolicies, {
          policySource: azureProtectedDataBillingProject,
        })
      );

      // Assert
      expect(screen.getByText(policyLabel)).toBeInTheDocument();
      screen.getByText('Additional security monitoring');
    });
  });

  it('allows passing a title and label about the list', async () => {
    // Act
    render(
      h(WorkspacePolicies, {
        title: 'Test title',
        policiesLabel: 'About this list:',
        policySource: protectedAzureWorkspace,
      })
    );

    // Assert
    expect(screen.getAllByText('Test title')).not.toBeNull();
    expect(screen.getAllByText('About this list:')).not.toBeNull();
  });
});
