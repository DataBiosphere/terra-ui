import { asMockedFn } from '@terra-ui-packages/test-utils';
import { getLocalPref } from 'src/libs/prefs';

import { recentlyViewedPersistenceId, updateRecentlyViewedWorkspaces } from './recentlyViewedWorkspaces';

const mockSetLocalPref = jest.fn();
jest.mock('src/libs/prefs', () => {
  return {
    ...jest.requireActual('src/libs/prefs'),
    getLocalPref: jest.fn(),
    setLocalPref: (...args) => mockSetLocalPref(...args),
  };
});

describe('recentlyViewedWorkspaces', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Date.now = jest.fn(() => 4);
  });

  it('adds a recently viewed workspace to an empty list', () => {
    asMockedFn(getLocalPref).mockReturnValue(undefined);

    updateRecentlyViewedWorkspaces('test-id');

    expect(mockSetLocalPref).toHaveBeenCalledWith(recentlyViewedPersistenceId, {
      recentlyViewed: [{ workspaceId: 'test-id', timestamp: 4 }],
    });
  });

  it('adds a recently viewed workspace to a non-empty list', () => {
    asMockedFn(getLocalPref).mockReturnValue({
      recentlyViewed: [
        { workspaceId: 'ws-2', timestamp: 2 },
        { workspaceId: 'ws-1', timestamp: 1 },
      ],
    });

    updateRecentlyViewedWorkspaces('test-id');

    expect(mockSetLocalPref).toHaveBeenCalledWith(recentlyViewedPersistenceId, {
      recentlyViewed: [
        { workspaceId: 'test-id', timestamp: 4 },
        { workspaceId: 'ws-2', timestamp: 2 },
        { workspaceId: 'ws-1', timestamp: 1 },
      ],
    });
  });

  it('caps the recently viewed list at four workspaces', () => {
    asMockedFn(getLocalPref).mockReturnValue({
      recentlyViewed: [
        { workspaceId: 'ws-3', timestamp: 3 },
        { workspaceId: 'ws-2', timestamp: 2 },
        { workspaceId: 'ws-1', timestamp: 1 },
        { workspaceId: 'ws-0', timestamp: 0 },
      ],
    });

    updateRecentlyViewedWorkspaces('test-id');

    expect(mockSetLocalPref).toHaveBeenCalledWith(recentlyViewedPersistenceId, {
      recentlyViewed: [
        { workspaceId: 'test-id', timestamp: 4 },
        { workspaceId: 'ws-3', timestamp: 3 },
        { workspaceId: 'ws-2', timestamp: 2 },
        { workspaceId: 'ws-1', timestamp: 1 },
      ],
    });
  });

  it('re-orders the recently viewed list if the new workspace is already in it and does not duplicate the entry', () => {
    asMockedFn(getLocalPref).mockReturnValue({
      recentlyViewed: [
        { workspaceId: 'ws-3', timestamp: 3 },
        { workspaceId: 'test-id', timestamp: 2 },
        { workspaceId: 'ws-1', timestamp: 1 },
        { workspaceId: 'ws-0', timestamp: 0 },
      ],
    });

    updateRecentlyViewedWorkspaces('test-id');

    expect(mockSetLocalPref).toHaveBeenCalledWith(recentlyViewedPersistenceId, {
      recentlyViewed: [
        { workspaceId: 'test-id', timestamp: 4 },
        { workspaceId: 'ws-3', timestamp: 3 },
        { workspaceId: 'ws-1', timestamp: 1 },
        { workspaceId: 'ws-0', timestamp: 0 },
      ],
    });
  });
});
