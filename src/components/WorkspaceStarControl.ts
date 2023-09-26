import _ from 'lodash/fp';
import { FC, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { icon, spinner } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useStore } from 'src/libs/react-utils';
import { AuthState, authStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

interface WorkspaceStarControlProps {
  workspace: WorkspaceWrapper;
}

export const WorkspaceStarControl: FC<WorkspaceStarControlProps> = ({ workspace }) => {
  const {
    workspace: { workspaceId },
  } = workspace;
  const {
    profile: { starredWorkspaces },
  } = useStore<AuthState>(authStore);
  const stars = _.isEmpty(starredWorkspaces) ? [] : _.split(',', starredWorkspaces);

  const [updatingStars, setUpdatingStars] = useState(false);
  const isStarred = _.includes(workspaceId, stars);

  // Thurloe has a limit of 2048 bytes for its VALUE column. That means we can store a max of 55
  // workspaceIds in list format. We'll use 50 because it's a nice round number and should be plenty
  // for the intended use case. If we find that 50 is not enough, consider introducing more powerful
  // workspace organization functionality like folders
  const MAX_STARRED_WORKSPACES = 50;
  const maxStarredWorkspacesReached = _.size(stars) >= MAX_STARRED_WORKSPACES;

  const refreshStarredWorkspacesList = async () => {
    // @ts-expect-error
    const { starredWorkspaces } = Utils.kvArrayToObject((await Ajax().User.profile.get()).keyValuePairs);
    return _.isEmpty(starredWorkspaces) ? [] : _.split(',', starredWorkspaces);
  };

  const toggleStar = _.flow(
    Utils.withBusyState(setUpdatingStars),
    withErrorReporting(`Unable to ${isStarred ? 'unstar' : 'star'} workspace`)
  )(async (star) => {
    const refreshedStarredWorkspaceList = await refreshStarredWorkspacesList();
    const updatedWorkspaceIds = star
      ? _.concat(refreshedStarredWorkspaceList, [workspaceId])
      : _.without([workspaceId], refreshedStarredWorkspaceList);
    await Ajax().User.profile.setPreferences({ starredWorkspaces: _.join(',', updatedWorkspaceIds) });
    Ajax().Metrics.captureEvent(Events.workspaceStar, {
      workspaceId,
      starred: star,
      ...extractWorkspaceDetails(workspace.workspace),
    });
    authStore.update(_.set('profile.starredWorkspaces', updatedWorkspaceIds.join(',')));
  });

  return h(
    Clickable,
    {
      tagName: 'span',
      role: 'checkbox',
      'aria-checked': isStarred,
      tooltip: Utils.cond(
        [updatingStars, () => 'Updating starred workspaces.'],
        [isStarred, () => 'Unstar this workspace.'],
        [
          !isStarred && !maxStarredWorkspacesReached,
          () => 'Star this workspace. Starred workspaces will appear at the top of your workspace list.',
        ],
        [
          !isStarred && maxStarredWorkspacesReached,
          () =>
            `A maximum of ${MAX_STARRED_WORKSPACES} workspaces can be starred. Please un-star another workspace before starring this workspace.`,
        ]
      ),

      'aria-label': isStarred ? 'This workspace is starred' : '',
      className: 'fa-layers fa-fw',
      disabled: updatingStars || (maxStarredWorkspacesReached && !isStarred),
      style: { verticalAlign: 'middle' },
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          e.target.click();
        }
      },
      onClick: () => toggleStar(!isStarred),
    },
    [
      updatingStars
        ? // @ts-expect-error
          spinner({ size: 20 })
        : icon('star', { size: 20, color: isStarred ? colors.warning() : colors.light(2) }),
    ]
  );
};
