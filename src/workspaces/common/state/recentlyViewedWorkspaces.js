import _ from 'lodash/fp';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';

export const recentlyViewedPersistenceId = 'workspaces/recentlyViewed';

export const updateRecentlyViewedWorkspaces = (workspaceId) => {
  const recentlyViewed = getLocalPref(recentlyViewedPersistenceId)?.recentlyViewed || [];
  // Recently viewed workspaces are limited to 4. Additionally, if a user clicks a workspace multiple times,
  // we only want the most recent instance stored in the list.
  const updatedRecentlyViewed = _.flow(
    _.remove({ workspaceId }),
    _.concat([{ workspaceId, timestamp: Date.now() }]),
    _.orderBy(['timestamp'], ['desc']),
    _.take(4)
  )(recentlyViewed);
  setLocalPref(recentlyViewedPersistenceId, { recentlyViewed: updatedRecentlyViewed });
};
