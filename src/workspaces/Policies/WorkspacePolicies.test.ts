import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { groupConstraintPolicy, protectedDataPolicy, regionConstraintPolicy } from 'src/testing/workspace-fixtures';
import { WorkspacePolicies } from 'src/workspaces/Policies/WorkspacePolicies';

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

  it('renders other policies without a tooltip', async () => {
    // Act
    render(
      h(WorkspacePolicies, {
        policies: [regionConstraintPolicy],
      })
    );

    // Assert
    screen.getByText('Policies');
    screen.getByText(regionConstraintPolicy.name);
    expect(screen.queryByText('More info')).toBeNull();
  });
});
