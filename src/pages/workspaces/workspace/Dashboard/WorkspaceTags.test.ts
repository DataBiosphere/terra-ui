import { act, screen, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { WorkspaceTags } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceTags';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

// set the collapsable panel to be open
jest.mock('src/libs/prefs', (): typeof import('src/libs/prefs') => ({
  ...jest.requireActual('src/libs/prefs'),
  getLocalPref: jest.fn().mockReturnValue(true),
}));

describe('WorkspaceTags', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays the tags on the workspace', async () => {
    // Arrange

    // Act
    await act(() =>
      render(
        h(WorkspaceTags, {
          workspace: {
            ...defaultGoogleWorkspace,
            workspace: {
              ...defaultGoogleWorkspace.workspace,
              attributes: {
                'tag:tags': {
                  itemsType: 'AttributeValue',
                  items: ['tag a', 'tag b'],
                },
              },
            },
            workspaceInitialized: true,
          },
          canEdit: true,
          refreshWorkspace: jest.fn(),
        })
      )
    );

    // Assert
    await waitFor(() => expect(screen.findByText('tag a')).not.toBeNull);

    expect(screen.findByText('tag b')).not.toBeNull;
  });
});
