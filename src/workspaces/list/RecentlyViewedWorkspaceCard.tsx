import { Clickable } from '@terra-ui-packages/components';
import React from 'react';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { getCloudProviderFromWorkspace, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface RecentlyViewedWorkspaceCardProps {
  workspace: Workspace;
  timestamp: string;
}

export const RecentlyViewedWorkspaceCard = (props: RecentlyViewedWorkspaceCardProps): React.ReactNode => {
  const { workspace, timestamp } = props;
  const {
    workspace: { namespace, name },
  } = workspace;

  const dateViewed = Utils.makeCompleteDate(new Date(parseInt(timestamp)).toString());

  return (
    <Clickable
      style={{
        ...Style.elements.card.container,
        maxWidth: 'calc(25% - 10px)',
        margin: '0 0.25rem',
        lineHeight: '1.5rem',
        flex: '0 1 calc(25% - 10px)',
      }}
      href={Nav.getLink('workspace-dashboard', { namespace, name })}
      onClick={() => {
        Ajax().Metrics.captureEvent(
          Events.workspaceOpenFromRecentlyViewed,
          extractWorkspaceDetails(workspace.workspace)
        );
      }}
    >
      <div style={{ flex: 'none' }}>
        <div style={{ color: colors.accent(), ...Style.noWrapEllipsis, fontSize: 16, marginBottom: 7 }}>{name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ ...Style.noWrapEllipsis, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
            Viewed {dateViewed}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloudProviderIcon cloudProvider={getCloudProviderFromWorkspace(workspace)} style={{ marginLeft: 5 }} />
          </div>
        </div>
      </div>
    </Clickable>
  );
};
