import _ from 'lodash/fp';
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { recentlyViewedPersistenceId, RecentlyViewedWorkspaceCard } from 'src/components/workspace-utils';
import { workspaceSubmissionStatus } from 'src/components/WorkspaceSubmissionStatusIcon';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';
import { getWorkspace, persistenceId } from 'src/pages/workspaces/WorkspacesList/WorkspacesList';

interface RecentlyViewedWorkspacesProps {
  workspaces: Workspace[];
  loadingSubmissionStats: boolean;
}

export const RecentlyViewedWorkspaces = (props: RecentlyViewedWorkspacesProps): ReactNode => {
  const { workspaces, loadingSubmissionStats } = props;
  const [recentlyViewedOpen, setRecentlyViewedOpen] = useState<boolean>(() =>
    _.defaultTo(true, getLocalPref(persistenceId)?.recentlyViewedOpen)
  );
  useEffect(() => {
    setLocalPref(persistenceId, { recentlyViewedOpen });
  }, [recentlyViewedOpen]);

  // A user may have lost access to a workspace after viewing it, so we'll filter those out just in case
  const recentlyViewed = useMemo(() => {
    const recent = getLocalPref(recentlyViewedPersistenceId)?.recentlyViewed || [];
    return _.filter((w) => getWorkspace(w.workspaceId, workspaces), recent);
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
                  loadingSubmissionStats,
                  timestamp,
                  submissionStatus: workspaceSubmissionStatus(workspace),
                });
              }, recentlyViewed)
            ),
          ]),
        ]
      )
    : h(Fragment);
};
