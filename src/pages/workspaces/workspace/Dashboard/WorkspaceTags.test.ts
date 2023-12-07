import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { WorkspaceTags } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceTags';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxExports = typeof import('src/libs/ajax');

jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

// set the collapsable panel to be open
jest.mock('src/libs/prefs', (): typeof import('src/libs/prefs') => ({
  ...jest.requireActual('src/libs/prefs'),
  getLocalPref: jest.fn().mockReturnValue(true),
}));

type ErrorExports = typeof import('src/libs/error');
jest.mock(
  'src/libs/error',
  (): ErrorExports => ({
    ...jest.requireActual('src/libs/error'),
    reportError: jest.fn(),
  })
);

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

describe('WorkspaceTags', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays the tags provided on the workspace', async () => {
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
        })
      )
    );

    // Assert
    expect(screen.queryByText('tag a')).not.toBeNull();
    expect(screen.queryByText('tag b')).not.toBeNull();
  });

  it('updates the list of tags when saving a new tag', async () => {
    // Arrange
    const initialTags = ['tag a', 'tag b'];
    const addedTag = 'new tag';
    const mockTagsFn = jest.fn().mockResolvedValue([...initialTags, addedTag]);
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          addTag: mockTagsFn,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);
    const user = userEvent.setup();

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
                  items: initialTags,
                },
              },
            },
            workspaceInitialized: true,
          },
          canEdit: true,
        })
      )
    );
    expect(screen.queryByText('tag a')).not.toBeNull();
    expect(screen.queryByText(addedTag)).toBeNull();

    const tagInput = screen.getByText('Add a tag');

    await user.click(tagInput);
    await user.keyboard(addedTag);
    await user.keyboard('[Enter]');

    // Assert
    await waitFor(() => expect(screen.queryByText(addedTag)).not.toBeNull());
    expect(screen.queryByText('tag a')).not.toBeNull();
    expect(screen.queryByText('tag b')).not.toBeNull();
    expect(mockTagsFn).toBeCalled();
  });

  it('updates the list of tags when deleting a tag', async () => {
    // Arrange
    const remainingTag = 'tag a';
    const deletingTag = 'tag b';

    const initialTags = [remainingTag, deletingTag];
    const mockTagsFn = jest.fn().mockResolvedValue([remainingTag]);
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        // the tags select component calls this when ???
        getTags: jest.fn().mockResolvedValue([initialTags]),
        workspace: jest.fn().mockReturnValue({
          deleteTag: mockTagsFn,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);
    const user = userEvent.setup();

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
                  items: initialTags,
                },
              },
            },
            workspaceInitialized: true,
          },
          canEdit: true,
        })
      )
    );
    expect(screen.queryByText(remainingTag)).not.toBeNull();
    expect(screen.queryByText(deletingTag)).not.toBeNull();

    const tagItem = screen.getByText(deletingTag);
    const removeButton = within(tagItem).getByRole('button');
    await user.click(removeButton);

    // Assert
    await waitFor(() => expect(screen.queryByText(deletingTag)).toBeNull());
    expect(screen.queryByText(remainingTag)).not.toBeNull();
    expect(mockTagsFn).toBeCalled();
  });
});
