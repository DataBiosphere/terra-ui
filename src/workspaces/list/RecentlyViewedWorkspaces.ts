import _ from 'lodash/fp';
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { recentlyViewedPersistenceId } from 'src/workspaces/common/state/recentlyViewedWorkspaces';
import { RecentlyViewedWorkspaceCard } from 'src/workspaces/list/RecentlyViewedWorkspaceCard';
import { getWorkspace, persistenceId } from 'src/workspaces/list/WorkspacesList';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface RecentlyViewedWorkspacesProps {
  workspaces: Workspace[];
}

export const RecentlyViewedWorkspaces = (props: RecentlyViewedWorkspacesProps): ReactNode => {
  const { workspaces } = props;
  const [recentlyViewedOpen, setRecentlyViewedOpen] = useState<boolean>(() =>
    _.defaultTo(true, getLocalPref(persistenceId)?.recentlyViewedOpen)
  );
  useEffect(() => {
    setLocalPref(persistenceId, { recentlyViewedOpen });
  }, [recentlyViewedOpen]);

  // A user may have lost access to a workspace after viewing it, so we'll filter those out just in case
  const recentlyViewed = useMemo(() => {
    const recent = getLocalPref(recentlyViewedPersistenceId)?.recentlyViewed || [];
    return _.filter((w) => {
      const ws = getWorkspace(w.workspaceId, workspaces);
      return !!ws && ws.workspace.state !== 'Deleted';
    }, recent);
  }, [workspaces]);

  return !_.isEmpty(workspaces) && !_.isEmpty(recentlyViewed)
    ? h(
        Collapse,
        {
          title: 'Recently Viewed',
          initialOpenState: recentlyViewedOpen,
          noTitleWrap: true,
          onClick: () => setRecentlyViewedOpen((v) => !v),
          summaryStyle: { margin: '0.5rem 0' },
        },
        [
          // Stop the click propagation here, otherwise using spacebar to click on a card will also collapse the Recently Viewed section
          span({ onClick: (e) => e.stopPropagation() }, [
            div(
              { style: { display: 'flex', flexWrap: 'wrap', paddingBottom: '1rem' } },
              _.map(({ workspaceId, timestamp }) => {
                const workspace = getWorkspace(workspaceId, workspaces);
                return h(RecentlyViewedWorkspaceCard, {
                  workspace,
                  timestamp,
                });
              }, recentlyViewed)
            ),
          ]),
        ]
      )
    : h(Fragment);
};
