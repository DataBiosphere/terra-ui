import { Icon, Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import React from 'react';
import { Clickable } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useStore } from 'src/libs/react-utils';
import { TerraUserState, userStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import {
  starredWorkspacesFromFavoriteResources,
  WorkspaceResourceTypeName,
  WorkspaceWrapper,
} from 'src/workspaces/utils';

interface WorkspaceStarControlProps {
  workspace: WorkspaceWrapper;
}

export const WorkspaceStarControl = (props: WorkspaceStarControlProps): ReactNode => {
  const {
    workspace: { workspaceId },
  } = props.workspace;
  const { favoriteResources } = useStore<TerraUserState>(userStore);
  const stars = starredWorkspacesFromFavoriteResources(favoriteResources);

  const [updatingStars, setUpdatingStars] = useState(false);
  const isStarred = _.includes(workspaceId, stars);

  const toggleFunc = async (star: boolean) => {
    const resource = { resourceTypeName: WorkspaceResourceTypeName, resourceId: workspaceId };
    star ? await Ajax().User.favorites.put(resource) : await Ajax().User.favorites.delete(resource);
    const favoriteResources = await Ajax().User.favorites.get();
    Ajax().Metrics.captureEvent(Events.workspaceStar, {
      workspaceId,
      starred: star,
      ...extractWorkspaceDetails(props.workspace.workspace),
    });
    userStore.update((state: TerraUserState) => ({
      ...state,
      favoriteResources,
    }));
  };

  const toggleStar = _.flow(
    Utils.withBusyState(setUpdatingStars),
    withErrorReporting(`Unable to ${isStarred ? 'unstar' : 'star'} workspace`)
  )(toggleFunc);

  const tooltip = Utils.cond(
    [updatingStars, () => 'Updating starred workspaces.'],
    [isStarred, () => 'Unstar this workspace.']
  );

  return (
    <Clickable
      tagName='span'
      role='checkbox'
      aria-checked={isStarred}
      tooltip={tooltip}
      aria-label={isStarred ? 'This workspace is starred' : ''}
      className='fa-layers fa-fw'
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          toggleStar(!isStarred);
        }
      }}
      onClick={() => toggleStar(!isStarred)}
    >
      {updatingStars && <Spinner size={20} />}
      {!updatingStars && <Icon icon='star' color={isStarred ? colors.warning() : colors.light(2)} />}
    </Clickable>
  );
};
