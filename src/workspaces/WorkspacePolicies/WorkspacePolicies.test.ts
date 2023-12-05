import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { AzureWorkspace } from 'src/libs/workspace-utils';
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
  it('renders nothing if the policy array is empty', () => {
    // Act
    render(
      h(WorkspacePolicies, {
        workspace: defaultAzureWorkspace,
      })
    );

    // Assert
    expect(screen.queryByText(/This workspace has the following/)).toBeNull();
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
        workspace: nonProtectedAzureWorkspace,
      })
    );

    // Assert
    expect(screen.queryByText(/This workspace has the following/)).toBeNull();
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
    expect(screen.getByText(/This workspace has the following/i)).toBeInTheDocument();
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
        workspace: protectedAzureWorkspace,
      })
    );

    // Act, click on the info button to get tooltip text to render.
    await user.click(screen.getByLabelText('More info'));

    // Assert
    expect(screen.getAllByText(/controlled-access data/)).not.toBeNull();
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
