import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { WorkspacePolicy } from 'src/libs/workspace-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { WorkspacePolicies } from 'src/workspaces/Policies/WorkspacePolicies';

const protectedDataPolicy: WorkspacePolicy = {
  namespace: 'terra',
  name: 'protected-data',
};

const groupConstraintPolicy: WorkspacePolicy = {
  namespace: 'terra',
  name: 'group-constraint',
  additionalData: [{ group: 'test-group' }],
};

describe('WorkspacePolicies', () => {
  it('renders nothing if the policy array is empty', () => {
    // Act
    render(
      h(WorkspacePolicies, {
        policies: [],
      })
    );

    // Assert
    expect(screen.queryByText('Policies')).toBeNull();
  });

  it('renders policies with no accessibility errors', async () => {
    // Act
    const { container } = render(
      h(WorkspacePolicies, {
        policies: [protectedDataPolicy, groupConstraintPolicy],
      })
    );

    // Assert
    expect(await axe(container)).toHaveNoViolations();
    screen.getByText('Policies');
    screen.getByText('Additional security monitoring');
    screen.getByText('Data access controls');
  });

  it('renders a tooltip for known policies', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      h(WorkspacePolicies, {
        policies: [protectedDataPolicy],
      })
    );

    // Act, click on the info button to get tooltip text to render.
    await user.click(screen.getByLabelText('More info'));

    // Assert
    expect(screen.getAllByText(/controlled-access data/)).not.toBeNull();
  });

  it('renders an unknown policy without a tooltip', async () => {
    // Act
    render(
      h(WorkspacePolicies, {
        policies: [{ name: 'unknown-policy' }],
      })
    );

    // Assert
    screen.getByText('Policies');
    screen.getByText('unknown-policy');
    expect(screen.queryByText('More info')).toBeNull();
  });
});
