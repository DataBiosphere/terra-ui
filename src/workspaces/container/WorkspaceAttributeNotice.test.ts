import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { WorkspaceAccessLevel } from 'src/libs/workspace-utils';
import { WorkspaceAttributeNotice } from 'src/workspaces/container/WorkspaceAttributeNotice';

describe('WorkspaceAttributeNotice', () => {
  it('renders read-only, locked, and protected workspace attributes, with no accessibility issues', async () => {
    // Arrange
    const accessLevel: WorkspaceAccessLevel = 'READER';
    const props = { accessLevel, isLocked: true, workspaceProtectedMessage: 'protected message' };
    // Act
    const { container } = render(h(WorkspaceAttributeNotice, props));
    // Assert
    expect(screen.queryByText('Workspace is locked')).not.toBeNull();
    expect(screen.queryByText('Workspace is read-only')).not.toBeNull();
    expect(screen.queryByText('protected message')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders no messages for unlocked with writer access, with no with no accessibility issues', async () => {
    // Arrange
    const accessLevel: WorkspaceAccessLevel = 'WRITER';
    const props = { accessLevel, isLocked: false };
    // Act
    const { container } = render(h(WorkspaceAttributeNotice, props));

    // Assert
    expect(screen.queryByText(/locked/)).toBeNull();
    expect(screen.queryByText(/read only/)).toBeNull();
    expect(screen.queryByText(/protected/)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
