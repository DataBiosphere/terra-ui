import { expect } from '@storybook/test';
import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { User } from 'src/libs/ajax/User';
import { userStore } from 'src/libs/state';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultInitializedGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceResourceTypeName } from 'src/workspaces/utils';

import { WorkspaceStarControl } from './WorkspaceStarControl';

type UserExports = typeof import('src/libs/ajax/User');
jest.mock('src/libs/ajax/User', (): UserExports => {
  return {
    ...jest.requireActual<UserExports>('src/libs/ajax/User'),
    User: jest.fn(),
  };
});
type UserContract = ReturnType<typeof User>;

const favoriteResources = [
  {
    resourceTypeName: WorkspaceResourceTypeName,
    resourceId: defaultInitializedGoogleWorkspace.workspace.workspaceId,
  },
];

describe('WorkspaceStarControl', () => {
  describe('When a user has been loaded', () => {
    describe('and the workspace is not starred', () => {
      it('renders an "unchecked" star', async () => {
        // Arrange
        userStore.update((state) => {
          return { ...state, favoriteResources: [] };
        });
        // Act
        await render(<WorkspaceStarControl workspace={defaultInitializedGoogleWorkspace} />);

        // Assert
        const star = screen.getByRole('checkbox');
        expect(star).not.toBeChecked();
      });
    });
    describe('and the workspace is starred', () => {
      it('renders a "checked" star', async () => {
        // Arrange
        userStore.update((state) => {
          return { ...state, favoriteResources };
        });

        // Act
        await render(<WorkspaceStarControl workspace={defaultInitializedGoogleWorkspace} />);

        // Assert
        const star = screen.getByRole('checkbox');
        expect(star).toBeChecked();
      });
    });
  });
  describe('when a user stars a workspace', () => {
    it('tells sam to favorite the workspace and renders a "checked" star', async () => {
      // Arrange
      const user = userEvent.setup();

      userStore.update((state) => {
        return { ...state, favoriteResources: [] };
      });

      const getFavoriteResourcesFunction = jest.fn().mockResolvedValue(favoriteResources);
      const putFavoriteResourcesFunction = jest.fn().mockResolvedValue({});
      const deleteFavoriteResourcesFunction = jest.fn().mockResolvedValue({});
      asMockedFn(User).mockImplementation(() => {
        return {
          favorites: {
            get: getFavoriteResourcesFunction,
            put: putFavoriteResourcesFunction,
            delete: deleteFavoriteResourcesFunction,
          },
        } as DeepPartial<UserContract> as UserContract;
      });
      // Act
      await act(() => render(<WorkspaceStarControl workspace={defaultInitializedGoogleWorkspace} />));

      // Assert
      const star = screen.getByRole('checkbox');
      expect(star).not.toBeChecked();

      await user.click(star);

      expect(getFavoriteResourcesFunction).toHaveBeenCalled();
      expect(putFavoriteResourcesFunction).toHaveBeenCalled();
      expect(deleteFavoriteResourcesFunction).not.toHaveBeenCalled();

      const newStar = screen.getByRole('checkbox');
      expect(newStar).toBeChecked;
    });
  });
  describe('when a user un-stars a workspace', () => {
    it('tells sam to un-favorite the workspace and renders an "unchecked" star', async () => {
      // Arrange
      const user = userEvent.setup();

      userStore.update((state) => {
        return { ...state, favoriteResources };
      });

      const getFavoriteResourcesFunction = jest.fn().mockResolvedValue([]);
      const putFavoriteResourcesFunction = jest.fn().mockResolvedValue({});
      const deleteFavoriteResourcesFunction = jest.fn().mockResolvedValue({});
      asMockedFn(User).mockImplementation(() => {
        return {
          favorites: {
            get: getFavoriteResourcesFunction,
            put: putFavoriteResourcesFunction,
            delete: deleteFavoriteResourcesFunction,
          },
        } as DeepPartial<UserContract> as UserContract;
      });
      // Act
      await act(() => render(<WorkspaceStarControl workspace={defaultInitializedGoogleWorkspace} />));

      // Assert
      const star = screen.getByRole('checkbox');
      expect(star).toBeChecked();

      await user.click(star);

      expect(getFavoriteResourcesFunction).toHaveBeenCalled();
      expect(putFavoriteResourcesFunction).not.toHaveBeenCalled();
      expect(deleteFavoriteResourcesFunction).toHaveBeenCalled();

      const newStar = screen.getByRole('checkbox');
      expect(newStar).not.toBeChecked;
    });
  });
});
