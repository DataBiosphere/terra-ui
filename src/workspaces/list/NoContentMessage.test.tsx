import { screen } from '@testing-library/react';
import React from 'react';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { NoWorkspacesMessage } from 'src/workspaces/common/NoWorkspacesMessage';
import { CategorizedWorkspaces } from 'src/workspaces/list/CategorizedWorkspaces';
import { NoContentMessage } from 'src/workspaces/list/NoContentMessage';
import { WorkspaceFilterValues } from 'src/workspaces/list/WorkspaceFilters';

jest.mock('src/workspaces/common/NoWorkspacesMessage');

describe('NoContentMessage', () => {
  const workspaces: CategorizedWorkspaces = {
    myWorkspaces: [defaultGoogleWorkspace],
    newAndInteresting: [],
    featured: [],
    public: [],
  };

  const emptyWorkspaces: CategorizedWorkspaces = {
    myWorkspaces: [],
    newAndInteresting: [],
    featured: [],
    public: [],
  };

  const filters: WorkspaceFilterValues = {
    keywordFilter: '',
    accessLevels: [],
    tab: 'myWorkspaces',
    tags: [],
  };

  it('displays loading message if workspaces are loading', () => {
    // Arrange
    const props = { loadingWorkspaces: true, workspaces, filters };

    // Act
    render(<NoContentMessage {...props} />);

    // Assert
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays no workspaces message if there are no workspaces', () => {
    // Arrange
    const props = { loadingWorkspaces: false, workspaces: emptyWorkspaces, filters };
    asMockedFn(NoWorkspacesMessage).mockReturnValue(<div>mockNoWorkspacesMessage</div>);

    // Act
    render(<NoContentMessage {...props} />);

    // Assert
    expect(screen.getByText('mockNoWorkspacesMessage')).toBeInTheDocument();
  });

  it('displays no matching workspaces message otherwise', () => {
    // Arrange
    const props = { loadingWorkspaces: false, workspaces, filters };

    // Act
    render(<NoContentMessage {...props} />);

    // Assert
    expect(screen.getByText('No matching workspaces')).toBeInTheDocument();
  });
});
